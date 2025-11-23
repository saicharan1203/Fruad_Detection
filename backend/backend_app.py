from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import os
from werkzeug.utils import secure_filename
from ml_models import FraudDetectionModel
from data_processor import DataProcessor
import json
from datetime import datetime
import io

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs('models', exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Global model instance
fraud_model = FraudDetectionModel()
processor = DataProcessor()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/sample-data', methods=['GET'])
def get_sample_data():
    """Generate and return sample data"""
    try:
        df = processor.generate_sample_data(1000)
        filepath = os.path.join(UPLOAD_FOLDER, 'sample_data.csv')
        df.to_csv(filepath, index=False)
        
        # Make sample JSON-serializable (convert timestamps/objects to strings)
        df_json = df.head(5).copy()
        for col in df_json.columns:
            if pd.api.types.is_datetime64_any_dtype(df_json[col]):
                df_json[col] = df_json[col].astype(str)
            elif df_json[col].dtype == 'object':
                try:
                    df_json[col] = df_json[col].astype(str)
                except:
                    pass
        
        return jsonify({
            'success': True,
            'message': 'Sample data generated',
            'rows': len(df),
            'columns': list(df.columns),
            'sample': df_json.to_dict(orient='records'),
            'filepath': filepath
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/validate-csv', methods=['POST'])
def validate_csv():
    """Validate uploaded CSV"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '' or file.filename is None:
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Only CSV files allowed'}), 400
        
        # Read file content
        content = file.read()
        
        # Check if file is empty
        if len(content) == 0:
            return jsonify({'success': False, 'error': 'File is empty'}), 400
        
        # Decode content
        try:
            decoded_content = content.decode('utf-8')
        except UnicodeDecodeError:
            return jsonify({'success': False, 'error': 'File encoding not supported. Please use UTF-8 encoded CSV files.'}), 400
        
        validation_result = processor.validate_csv(decoded_content)
        
        if validation_result['success']:
            # Save file
            filename = secure_filename(file.filename or 'uploaded_file.csv')
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            
            # Write file to disk
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(decoded_content)
            
            validation_result['filepath'] = filepath
        
        return jsonify(validation_result)
    
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return jsonify({'success': False, 'error': f'Upload failed: {str(e)}'}), 500

@app.route('/api/train', methods=['POST'])
def train_model():
    """Train fraud detection model"""
    try:
        data = request.get_json() if request.is_json else {}
        filepath = data.get('filepath') if isinstance(data, dict) else None
        fraud_column = data.get('fraud_column', 'is_fraud') if isinstance(data, dict) else 'is_fraud'
        
        if not filepath or not os.path.exists(filepath):
            return jsonify({'success': False, 'error': 'Invalid filepath'}), 400
        
        # Load data
        df = pd.read_csv(filepath)
        
        print(f"Training with {len(df)} samples...")
        training_stats = fraud_model.train(df, fraud_column)
        
        # Save model
        fraud_model.save('models')
        
        return jsonify({
            'success': True,
            'message': 'Model trained successfully',
            'stats': training_stats
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/predict', methods=['POST'])
def predict():
    """Predict fraud on new transactions"""
    try:
        # Check if we have a file or filepath
        filepath = None
        if 'file' in request.files:
            file = request.files['file']
            
            if not allowed_file(file.filename):
                return jsonify({'success': False, 'error': 'Only CSV files allowed'}), 400
            
            # Save file temporarily and read it
            filename = secure_filename(file.filename or 'prediction_file.csv')
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
        elif request.is_json:
            data = request.get_json()
            filepath = data.get('filepath') if isinstance(data, dict) else None
            
            if not filepath or not os.path.exists(filepath):
                return jsonify({'success': False, 'error': 'Invalid filepath'}), 400
        else:
            return jsonify({'success': False, 'error': 'No file or filepath provided'}), 400
        
        # Load data
        df = pd.read_csv(filepath)
        
        print(f"Predicting on {len(df)} transactions...")
        results_df = fraud_model.predict(df)
        
        # Calculate statistics
        # Add required columns if they don't exist
        required_cols = ['is_fraud_predicted', 'is_anomaly', 'ensemble_fraud_probability', 'risk_level', 'merchant_category']
        for col in required_cols:
            if col not in results_df.columns:
                if col == 'is_fraud_predicted':
                    results_df[col] = 0
                elif col == 'is_anomaly':
                    results_df[col] = 0
                elif col == 'ensemble_fraud_probability':
                    results_df[col] = 0.0
                elif col == 'risk_level':
                    results_df[col] = 'Low'
                elif col == 'merchant_category':
                    results_df[col] = 'unknown'
        
        stats = processor.get_statistics(results_df)
        
        # Prepare response
        results_for_json = results_df.copy()
        
        # Convert to JSON-serializable format
        for col in results_for_json.columns:
            if results_for_json[col].dtype == 'object':
                try:
                    results_for_json[col] = results_for_json[col].astype(str)
                except:
                    pass
        
        # Save results
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        results_filepath = os.path.join(UPLOAD_FOLDER, f'predictions_{timestamp}.csv')
        results_df.to_csv(results_filepath, index=False)
        
        return jsonify({
            'success': True,
            'statistics': stats,
            'results': results_for_json.head(100).to_dict(orient='records'),
            'total_results': len(results_df),
            'results_file': results_filepath
        })
    
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/download-results/<filename>', methods=['GET'])
def download_results(filename):
    """Download prediction results"""
    try:
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(filepath, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/save-model', methods=['POST'])
def save_model():
    """Save trained models to a named version"""
    try:
        data = request.get_json() if request.is_json else {}
        name = (data or {}).get('name')
        if not name:
            return jsonify({'success': False, 'error': 'Model name is required'}), 400
        path = os.path.join('models', secure_filename(str(name)))
        fraud_model.save(path)
        return jsonify({'success': True, 'message': f'Models saved to {path}'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/model-info', methods=['GET'])
def model_info():
    """Get model information"""
    try:
        if fraud_model.feature_names is None:
            return jsonify({
                'trained': False,
                'message': 'Model not trained yet'
            })
        
        return jsonify({
            'trained': True,
            'features': fraud_model.feature_names,
            'num_features': len(fraud_model.feature_names),
            'model_type': 'Ensemble (Random Forest + XGBoost + Isolation Forest)'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/load-model', methods=['POST'])
def load_model():
    """Load previously saved models from disk"""
    try:
        data = request.get_json() if request.is_json else {}
        name = (data or {}).get('name')
        path = os.path.join('models', name) if name else 'models'
        fraud_model.load(path)
        return jsonify({
            'success': True,
            'message': f"Models loaded from {path}",
            'trained': True,
            'features': fraud_model.feature_names or [],
            'num_features': len(fraud_model.feature_names or [])
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)