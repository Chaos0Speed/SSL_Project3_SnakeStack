from flask import Flask, request, send_file, jsonify
import datetime
import os

HISTORY = 'history.txt'

if not os.path.exists(HISTORY):
    with open(HISTORY, 'w') as f:
#        f.write("Player,Score,Survival Time,DeathCause,[Logged time]\n")
        pass

app = Flask(__name__, static_folder='static')

@app.route('/')
def start():
    return send_file('static/index.html')

@app.route('/save_score', methods=['POST'])
def save_score():

    data = request.get_json()
    
    name = data.get('username')
    score = data.get('score')
    duration = data.get('survival_time')
    cause = data.get('cause')
    
    # Save to your file
    with open(HISTORY, 'a') as f:
        f.write(f"{name},{score},{cause},{duration}s,[{datetime.datetime.now().strftime("%d-%m-%Y %H:%M:%S")}]\n")
    
    return jsonify({"status": "success", "message": "Score recorded!"})

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port = 5000)