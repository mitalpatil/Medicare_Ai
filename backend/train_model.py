# train_disease_model.py

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

# Load dataset
df = pd.read_csv("dataset.csv")

# Clean and preprocess
df.fillna('', inplace=True)
symptom_columns = [col for col in df.columns if col.lower().startswith('symptom')]
df['Symptoms'] = df[symptom_columns].values.tolist()
df['Symptoms'] = df['Symptoms'].apply(lambda x: [s.strip().lower().replace(' ', '_') for s in x if s])
df['Disease'] = df['Disease'].str.strip().str.lower().replace(' ', '_')

# Encode symptoms
mlb = MultiLabelBinarizer()
X = mlb.fit_transform(df['Symptoms'])
y = df['Disease']

# Optional: Split for evaluation
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train the model
model = RandomForestClassifier(n_estimators=200, random_state=42)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
print("Model Evaluation Report:\n")
print(classification_report(y_test, y_pred))

# Save model and encoder
joblib.dump(model, "disease_model.pkl")
joblib.dump(mlb, "symptom_encoder.pkl")
