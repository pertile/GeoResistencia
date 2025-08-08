For processing line buses:
- Use the query from overpass-query-buses in Overpass
- Export it to geojson
- Put it in the same directory as "buses.json"
- Run process_buses.py
- Now you have buses-simple which is the file that colectivos.js read


Overpass gets all of the relations with type=bus, you have to change with the areas of your intended cities.
