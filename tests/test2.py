import os
import sys
import pandas as pd
from fire import Fire

def count_gender(file_name: str, col_name: str):
    desktop_path = os.path.join(os.path.join(os.environ['USERPROFILE']), 'Desktop')
    file_path = os.path.join(desktop_path, file_name)
    df = pd.read_excel(file_path)
    gender_count = df[col_name].value_counts()
    html_table = f'''
    <table class="table table-striped">
        <thead>
            <tr>
                <th>Gender</th>
                <th>Count</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Male</td>
                <td>{gender_count['Male']}</td>
            </tr>
            <tr>
                <td>Female</td>
                <td>{gender_count['Female']}</td>
            </tr>
        </tbody>
    </table>
    '''
    print(html_table)

if __name__ == '__main__':
    Fire(count_gender)