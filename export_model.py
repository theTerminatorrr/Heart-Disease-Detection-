# Run once:  python export_model.py   (data.csv in the same folder)
# Trains the SAME model as the notebook (default LogisticRegression, same split/seed) and writes model.js
import json, pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

df = pd.read_csv("data.csv", encoding="utf-8-sig")
X, Y = df.drop(columns="target"), df["target"]
X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=0.2, stratify=Y, random_state=2)
model = LogisticRegression()        # defaults, identical to the notebook
model.fit(X_train, Y_train)
print("Train accuracy:", model.score(X_train, Y_train))
print("Test accuracy :", model.score(X_test, Y_test))
data = {"features": list(X.columns), "coef": model.coef_[0].tolist(), "intercept": float(model.intercept_[0])}
open("model.js", "w").write("const MODEL = " + json.dumps(data, indent=2) + ";\n")
print("Saved model.js")
