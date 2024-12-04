import requests
import pandas as pd

def get_state_from_coords(latitude, longitude):
    api_key = "" # geocoding google api key
    url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={latitude},{longitude}&key={api_key}"
    response = requests.get(url)
    data = response.json()

    if data['status'] == 'OK':
        for component in data['results'][0]['address_components']:
            if 'administrative_area_level_1' in component['types']:
                return component['short_name']
    return None

df = pd.read_csv('preprocessed_data/wells_by_location.csv')
df['state'] = df.apply(lambda row: get_state_from_coords(row['dec_lat_va'], row['dec_long_va']), axis=1)
df.to_csv('preprocessed_data/wells_by_location_with_state.csv')
