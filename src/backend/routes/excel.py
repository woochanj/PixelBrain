from flask import Blueprint, jsonify, request
# import pandas as pd # 나중에 필요할 때 주석 해제

excel_bp = Blueprint('excel', __name__)

@excel_bp.route('/analyze', methods=['POST'])
def analyze_excel():
    # 여기에 엑셀 처리 로직이 들어갈 예정입니다.
    return jsonify({"message": "Excel analysis endpoint not implemented yet."})
