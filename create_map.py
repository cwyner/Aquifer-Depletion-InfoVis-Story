import pandas as pd
import folium
from folium.plugins import MarkerCluster


# Step 1: Read the CSV file
print('Reading .csv file...')
df = pd.read_csv('preprocessed_data/wells_by_location.csv')
print(df.shape)
df.dropna(subset=['dec_lat_va', 'dec_long_va'], inplace=True)
print(df.shape)

# Step 3: Create a map centered on the cleaned dataset
print('Creating map...')
map_center = [df['dec_lat_va'].mean(), df['dec_long_va'].mean()]
mymap = folium.Map(location=map_center, zoom_start=6)

marker_cluster = MarkerCluster().add_to(mymap)
for index, row in df.iterrows():
    folium.Marker(
        location=[row['dec_lat_va'], row['dec_long_va']],
        popup=f"{row['station_nm']}: ({row['dec_lat_va']}, {row['dec_long_va']})"
    ).add_to(marker_cluster)

# Create map without clustering (crashes because too many data points)
# for index, row in df.iterrows():
#     folium.Marker(
#         location=[row['dec_lat_va'], row['dec_long_va']],
#         popup=f"{row['station_nm']}: ({row['dec_lat_va']}, {row['dec_long_va']})"
#     ).add_to(mymap)

mymap.save("map.html")
print("Map saved to 'map.html'")
