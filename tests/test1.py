import os
import win32com.client as win32

# Get username from environment variable
username = os.environ['USERNAME']

# Initialize variables
file_name = 'Employee Sample Data.xlsx'
col_name = 'F'

# Open Excel file
excel = win32.gencache.EnsureDispatch('Excel.Application')
workbook = excel.Workbooks.Open(f'C:\\Users\\{username}\\Desktop\\{file_name}')

# Get worksheet
worksheet = workbook.Worksheets(1)

# Get range of data
data_range = worksheet.Range(f'{col_name}1:{col_name}{worksheet.UsedRange.Rows.Count}')

# Count number of Male and Female employees
male_count = 0
female_count = 0
for cell in data_range:
    if cell.Value == 'Male':
        male_count += 1
    elif cell.Value == 'Female':
        female_count += 1

# Print count in HTML table with Bootstrap 5 classes
print(f'<table class="table table-striped"><thead><tr><th>Gender</th><th>Count</th></tr></thead><tbody><tr><td>Male</td><td>{male_count}</td></tr><tr><td>Female</td><td>{female_count}</td></tr></tbody></table>')

# Close Excel file
workbook.Close(False)
excel.Quit()