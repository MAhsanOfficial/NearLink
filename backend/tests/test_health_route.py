import requests

def test_health():
    url = "http://localhost:8000/api/health"
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.json()}")
    except Exception as e:
        print(f"Error connecting to {url}: {e}")

if __name__ == "__main__":
    # Note: This requires the backend to be running
    test_health()
