import pandas as pd
import matplotlib.pyplot as plt

# Step 1: Load the data
# Replace 'your_file.csv' with the path to your CSV file
print('Reading .csv file...')
df = pd.read_csv('preprocessed_data/monthly_avg_well_depth_since_2000.csv')

# Step 3: Group by year and month, calculate the average depth
grouped = df.groupby(['year', 'month'])['water_depth_ft'].mean().reset_index()

# Step 4: Pivot the data to have years as columns and months as rows
pivoted = grouped.pivot(index='month', columns='year', values='water_depth_ft')

# Step 5: Plot the data
plt.figure(figsize=(10, 6))
for year in pivoted.columns:
    if year in [2004, 2005, 2009]:
        continue
    plt.plot(pivoted.index, pivoted[year], marker='o', label=str(year))

# Customize the plot
plt.title('Monthly Average Well Depth by Year')
plt.xlabel('Month')
plt.ylabel('Average Depth')
plt.xticks(range(1, 13))  # Months as integers from 1 to 12
plt.legend(title='Year')
plt.grid(True)
plt.tight_layout()

# plt.savefig('monthly_avg_well_depth_since_2000.png')

# Show the plot
plt.show()