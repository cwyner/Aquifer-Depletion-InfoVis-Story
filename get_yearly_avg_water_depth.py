import pandas as pd

# Step 1: Load the data
# Replace 'your_file.csv' with the path to your CSV file
print('Reading .csv file...')
df = pd.read_csv('all_well_data/all_well_data.tsv')
print(df.shape)
df.dropna(subset=['dec_lat_va', 'dec_long_va', 'station_nm', 'datetime', 'water_depth_ft'], inplace=True)
print(df.shape)

df['water_depth_ft'] = pd.to_numeric(df['water_depth_ft'], errors='coerce')

df.dropna(subset=['water_depth_ft'], inplace=True)
print(df.shape)


# Step 2: Convert the date column to a datetime object
df['datetime'] = pd.to_datetime(df['datetime'])

# Step 3: Extract the year from the date column
df['year'] = df['datetime'].dt.year

# Step 4: Group by 'year' (and optionally 'location') and calculate averages
# If you have multiple locations:
average_by_year = df.groupby(['station_nm', 'dec_lat_va', 'dec_long_va', 'year'])['water_depth_ft'].mean().reset_index()


# Step 5: Save the results to a new CSV file
average_by_year.to_csv('preprocessed_data/yearly_avg_water_depth.csv', index=False)

print("Yearly averages saved to 'preprocessed_data/yearly_avg_water_depth.csv'")
