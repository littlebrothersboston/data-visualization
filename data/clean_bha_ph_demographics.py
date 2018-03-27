import csv
import json

input_file_name = "BHA PH Demographics.csv"
output_file_name = "bha_demographics.json"

with open(input_file_name) as file:
    # First three lines are the title, a blank line, and then column labels
    title = file.readline()
    blank_line = file.readline()
    labels = file.readline().replace("\n", "").split(",")

    # accumulate the rows we want to keep
    out = []
    for line in csv.reader(file):
        # if the first element is an integer, it has a development # and therefore we want to keep it
        try:
            int(line[0])
            out.append(line)
        except ValueError:
            # If it can't be converted to an int, go to the next line
            pass


# Make a dictionary with each set of values and the labels
output = [dict(zip(labels, values)) for values in out]

# Write the json to the file
with open(output_file_name, mode='w') as output_file:
    output_file.write(json.dumps(output))
