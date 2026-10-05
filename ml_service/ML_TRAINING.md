# SCAMCHECK ML Training Pipeline

## Datasets
- **UCI SMS Spam Collection** (always used): 5,574 English SMS messages, 747 spam. Downloaded automatically if `data/SMSSpamCollection` is missing.
- **EMSCAD – Real or Fake Job Postings** (optional, recommended): about 18,000 job postings, around 800 fraudulent. Download `fake_job_postings.csv` from Kaggle into `data/`. `train.py` merges it automatically, so the model learns recruitment-fraud language.

## Pipeline (`train.py`)
1. Split 70/15/15 (train/validation/test), stratified by dataset and label.
2. TF-IDF features: word unigrams and bigrams, sublinear TF, keeping tokens with digits and symbols such as ₹, @ and $.
3. Train Logistic Regression, Linear SVM and Random Forest, each wrapped in `CalibratedClassifierCV` (sigmoid) so outputs are real probabilities.
4. Tune each model's decision threshold on validation data for best F1.
5. Pick the model with the best validation F1, then report metrics on the untouched test set.
6. Save `models/model.pkl`, `models/vectorizer.pkl` and `models/evaluation.json` (metrics, threshold, datasets, scikit-learn version).

## Current model (SMS data only)
Linear SVM, threshold 0.67. Test set: accuracy 98.4%, precision 97.1%, recall 91.1%, F1 94.0%, ROC-AUC 0.99.

## Serving (`app.py`)
The service loads the trained model at startup. The score combines the model's probability with recruitment-fraud cues (fees, OTP or credential requests, no-interview selection, Telegram/WhatsApp contact, urgency, threats) using a noisy-OR. If the model files are missing, it falls back to the cues alone and reports `scamcheck-cue-fallback` as the model name. `GET /health` shows whether the model is loaded.

`requirements.txt` pins the scikit-learn version the model was trained with; the service logs a warning on a mismatch.

## Retrain
```bash
cd ml_service
pip install -r requirements.txt
python train.py
python -m pytest tests
```
