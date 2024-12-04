import pandas as pd
import matplotlib.pyplot as plt

# Step 1: Load the data
# Replace 'your_file.csv' with the path to your CSV file
print('Reading .csv file...')
df = pd.read_csv('preprocessed_data/yearly_avg_water_depth.csv')

# Step 3: Group by year and month, calculate the average depth
yearly_avg_depth = df.groupby(['year'])['water_depth_ft'].mean()

# Step 4: Plot the data
plt.figure(figsize=(10, 6))
yearly_avg_depth.plot(kind='line', marker='o')
plt.title('Yearly Average Well Depth')
plt.xlabel('Year')
plt.ylabel('Average Depth (ft)')
plt.grid(True)
plt.tight_layout()

plt.savefig('yearly_avg_well_depth.png')

# Show the plot
plt.show()