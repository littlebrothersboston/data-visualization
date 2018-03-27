import csv
import json


input_file_name = "BHA-Unit-Summary-Directory.csv"
output_file_name = "bha_unit_summary.json"


with open(input_file_name) as input:
    title = input.readline()
    extra = input.readline()

    labels = input.readline().replace("\n", "").split(",")
    # Get rid of the non-breaking space
    labels[1] = labels[1].replace("\u00a0", " ")

    out = []
    seen_mixed_financial_developments = False
    for line in csv.reader(input):
        # Here, we keep only the lines up until the end of "mixed financed developments"
        if line[0] == "Mixed Financed Developments":
            seen_mixed_financial_developments = True
        if seen_mixed_financial_developments and line[1] == "":
            break

        if line[1] != "":
            out.append(line)


# Make a dictionary with each set of values and the labels
output = [dict(zip(labels[1:], values[1:])) for values in out]

# Write the json to the file
with open(output_file_name, mode='w') as output_file:
    output_file.write(json.dumps(output))

