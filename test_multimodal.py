import requests
import json

url = "http://localhost:3000/api/investigate"

with open("test1.png", "w") as f:
    f.write("Fake PNG content representing an image with hr.googleinternships@gmail.com and http://fakejob.com")
with open("test2.pdf", "w") as f:
    f.write("Fake PDF content containing a phone number +91 9876543210 and requesting payment to bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh")

files = [
    ('files', ('test1.png', open('test1.png', 'rb'), 'image/png')),
    ('files', ('test2.pdf', open('test2.pdf', 'rb'), 'application/pdf'))
]

response = requests.post(url, files=files)
print(response.status_code)
try:
    data = response.json()
    print(json.dumps(data.get('multimodal', {}), indent=2))
except Exception as e:
    print("Error parsing json:", e)
    print(response.text[:1000])
