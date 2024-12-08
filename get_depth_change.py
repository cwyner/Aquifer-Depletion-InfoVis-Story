import pandas as pd

df = pd.read_csv('preprocessed_data/yearly_avg_water_depth.csv')
df_filtered = df[df['year'].isin([2000, 2023])]

# Pivot the dataframe to have 2010 and 2023 depths in separate columns
df_pivot = df_filtered.pivot(index=['station_nm', 'dec_lat_va', 'dec_long_va'], columns='year', values='water_depth_ft').reset_index()

# Rename columns for clarity
df_pivot.columns.name = None  # Remove the column name ('year') set by pivot
df_pivot.rename(columns={2000: 'depth_2000', 2023: 'depth_2023'}, inplace=True)

# Calculate the depth change from 2010 to 2023
df_pivot['depth_change'] = df_pivot['depth_2023'] - df_pivot['depth_2000']

df_pivot.to_csv('preprocessed_data/depth_change.csv', index=False)
