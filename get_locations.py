import pandas as pd


# Step 1: Read the CSV file
print('Reading .csv file...')
df = pd.read_csv('preprocessed_data/wells_by_location.csv')

print('Saving cleaned .csv file...')
df_cleaned = df.drop_duplicates(subset=['dec_lat_va', 'dec_long_va'])
df_cleaned[['station_nm', 'dec_lat_va', 'dec_long_va']].to_csv('preprocessed_data/wells_by_location.csv')

print("Cleaned .csv saved to 'preprocessed_data/wells_by_location.csv'")
