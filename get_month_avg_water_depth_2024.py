import pandas as pd

# Step 1: Load the data
# Replace 'your_file.csv' with the path to your CSV file
print('Reading .csv file...')
df = pd.read_csv('all_well_data/all_well_data.tsv')

df.dropna(subset=['dec_lat_va', 'dec_long_va', 'station_nm', 'datetime', 'water_depth_ft'], inplace=True)
df['water_depth_ft'] = pd.to_numeric(df['water_depth_ft'], errors='coerce')
df.dropna(subset=['water_depth_ft'], inplace=True)

# Step 2: Convert the date column to a datetime object
df['datetime'] = pd.to_datetime(df['datetime'])

# Step 3: Extract the year from the date column
df = df[(df['datetime'].dt.year < 2024) & (df['datetime'].dt.year > 1999)]
df['month'] = df['datetime'].dt.month
df['year'] = df['datetime'].dt.year

average_by_year = df.groupby(['station_nm', 'dec_lat_va', 'dec_long_va', 'month', 'year'])['water_depth_ft'].mean().reset_index()

# Step 5: Save the results to a new CSV file
average_by_year.to_csv('preprocessed_data/monthly_avg_well_depth_since_2000.csv', index=False)
