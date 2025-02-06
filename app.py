from flask import Flask, render_template, request, jsonify, session, send_from_directory, make_response, request, redirect, url_for, session
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
import pytz
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Replace with your actual VBB API key
api_key = "zxczvxvsdgdsgdsg"

def get_station_names(api_key, station_name, max_results):
    url = " https://fahrinfo.vbb.de/restproxy/latest/location.name"
    params = {
        "accessId": api_key,
        "input": station_name,
        "maxNo": max_results,
        "type": "S"
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        root = ET.fromstring(response.content)
        ns = {"h": "http://hacon.de/hafas/proxy/hafas-proxy"}
        
        station_names = []
        station_info_map = {}
        
        stop_locations = root.findall(".//h:StopLocation", ns)
        
        for stop_location in stop_locations:
            station_name = stop_location.get("name")
            ext_id = stop_location.get("extId")
            
            station_names.append(station_name)
            station_info_map[station_name] = {
                "extId": ext_id,
            }
        return station_names, station_info_map
        
    except requests.exceptions.HTTPError as e:
        error_message = f"HTTP Error: {e.response.status_code}"
    except requests.exceptions.Timeout:
        error_message = "The request timed out. Please try again."
    except requests.exceptions.RequestException as e:
        error_message = f"Error occurred: {e}"
    # Render the error page with the specific message
    return None, None, error_message

def get_departure_board(api_key, station_id):
    url = f"https://fahrinfo.vbb.de/restproxy/latest/departureBoard?accessId={api_key}&extId={station_id}&duration=60"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        root = ET.fromstring(response.content)
        ns = {"h": "http://hacon.de/hafas/proxy/hafas-proxy"}
        
        departures = []
        
        # Extract station name from the first <Departure> element
        first_departure = root.find(".//h:Departure", ns)
        if first_departure is not None:
            station_name = first_departure.get("stop")
        else:
            station_name = "Unknown"
        
        # Berlin timezone
        berlin_tz = pytz.timezone('Europe/Berlin')
        current_time = datetime.now(berlin_tz).replace(second=0, microsecond=0)
        
        for departure_elem in root.findall(".//h:Departure", ns):
            departure = {}
            
            departure["name"] = departure_elem.get("name")
            departure["direction"] = departure_elem.get("direction")
            departure["planned_time"] = departure_elem.get("time")
            departure["planned_date"] = departure_elem.get("date")
            departure["real_time"] = departure_elem.get("rtTime")
            departure["real_date"] = departure_elem.get("rtDate")
            departure["platform"] = departure_elem.get("platform")
            departure["rtPlatform"] = departure_elem.get("rtPlatform")

            # Platform handling
            rt_platform_elem = departure_elem.find(".//h:rtPlatform", ns)
            platform_elem = departure_elem.find(".//h:platform", ns)

            # Initialize both to None initially
            departure["rtPlatform"] = None
            departure["platform"] = None

            # If rtPlatform exists and has text
            if rt_platform_elem is not None and rt_platform_elem.get("text"):
                departure["rtPlatform"] = rt_platform_elem.get("text").strip()

            # If platform exists and has text
            if platform_elem is not None and platform_elem.get("text"):
                departure["platform"] = platform_elem.get("text").strip()

            # Determine which platform to display
            if departure["rtPlatform"] and departure["platform"]:
                # Both exist, prefer rtPlatform
                departure["platform"] = departure["rtPlatform"]
            elif departure["rtPlatform"] and not departure["platform"]:
                # Only rtPlatform exists
                departure["platform"] = departure["rtPlatform"]
            elif not departure["rtPlatform"] and departure["platform"]:
                # Only platform exists, use it as is
                pass  # Platform is already set
            else:
                # Neither platform nor rtPlatform exist, set default to "N/A"
                departure["platform"] = "N/A"

            product_elem = departure_elem.find(".//h:ProductAtStop", ns)
            if product_elem is not None:
                departure["product_type"] = product_elem.get("catOut")  # Retrieve product category
            else:
                departure["product_type"] = "Unknown"

            # Edit departure name if product type is "Bus"
            if departure["product_type"] == "Bus":
                departure["name"] = "B" + departure["name"]   
            
            # Edit departure name if product type is "Tram"
            if departure["product_type"] == "Tram":
                departure["name"] = "T" + departure["name"]   

            # Custom logic for Ringbahn S41 and S42
            if departure["direction"] == "Ringbahn S 41":
                departure["direction"] = "Ring ↻"
            elif departure["direction"] == "Ringbahn S 42":
                departure["direction"] = "Ring ↺"
            
            # Check if departure is cancelled and reachable
            cancelled = departure_elem.get("cancelled") == "true"
            reachable = departure_elem.get("reachable") == "true"
            departure["cancelled"] = cancelled
            departure["reachable"] = reachable
            
            
            if departure["cancelled"]:
                departure["time_left_str"] = "Cancelled"
                
                # Parse notes for cancellation reason
                notes = []
                for note_elem in departure_elem.findall(".//h:Note[@type='R']", ns):
                    note = {
                        "key": note_elem.get("key"),
                        "type": note_elem.get("type"),
                        "txtN": note_elem.text.strip() if note_elem.text else ""
                    }
                    notes.append(note)
                
                # Choose the most relevant note (e.g., the most descriptive one)
                if notes:
                    most_relevant_note = max(notes, key=lambda n: len(n['txtN']))
                    departure["notes"] = [most_relevant_note]
                else:
                    departure["notes"] = []
            
            else:
                # Calculate time left to departure
                if departure["real_time"] and departure["real_date"]:
                    rt_datetime_str = f"{departure['real_date']} {departure['real_time']}"
                else:
                    rt_datetime_str = f"{departure['planned_date']} {departure['planned_time']}"
                
                try:
                    rt_datetime = datetime.strptime(rt_datetime_str, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    # Handle cases where time format might be different
                    rt_datetime = datetime.strptime(rt_datetime_str, "%Y-%m-%d %H:%M")
                
                # Convert to Berlin timezone
                rt_datetime = berlin_tz.localize(rt_datetime)
                
                time_to_departure = (rt_datetime - current_time).total_seconds() // 60
                
                if time_to_departure <= 0:
                    departure["time_left_str"] = "Jetzt"
                else:
                    departure["time_left_str"] = f"{int(time_to_departure)}'"
            
            # Ensure rt_datetime is always assigned
            if departure.get("real_time") and departure.get("real_date"):
                rt_datetime_str = f"{departure['real_date']} {departure['real_time']}"
                try:
                    rt_datetime = datetime.strptime(rt_datetime_str, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    rt_datetime = datetime.strptime(rt_datetime_str, "%Y-%m-%d %H:%M")
            else:
                rt_datetime_str = f"{departure['planned_date']} {departure['planned_time']}"
                try:
                    rt_datetime = datetime.strptime(rt_datetime_str, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    rt_datetime = datetime.strptime(rt_datetime_str, "%Y-%m-%d %H:%M")
            
            # Convert to Berlin timezone
            rt_datetime = berlin_tz.localize(rt_datetime)
            departure["datetime"] = rt_datetime  # Add the datetime object for sorting
            departures.append(departure)
        
        return departures, station_name
    
    except requests.exceptions.HTTPError as e:
        return None, f"HTTP error occurred: {e.response.status_code} - {e.response.reason}"
    except requests.exceptions.RequestException as e:
        return None, f"Error occurred during departure board request: {str(e)}"
    except ET.ParseError as e:
        return None, f"Error parsing XML response: {str(e)}"
    
def render_error(message):
    return render_template('error.html', error_message=message)

@app.route('/', methods=['GET', 'POST'])
def search_station():
    if request.method == 'POST':
        station_name = request.form['station_name']
        max_results = request.form.get('max_results', 5, type=int)
        station_names, station_info_map = get_station_names(api_key, station_name, max_results)
        if station_names and station_info_map:
            # Store the search results in the session
            session['station_names'] = station_names
            session['station_info_map'] = station_info_map
            return render_template('search.html', station_names=station_names, station_info_map=station_info_map)
        else:
            return render_error(f"No stations found for '{station_name}' or an error occurred.")
    
    # Retrieve the previous search results from the session
    station_names = session.get('station_names', [])
    station_info_map = session.get('station_info_map', {})
    return render_template('search.html', station_names=station_names, station_info_map=station_info_map)

@app.route('/api/search', methods=['POST'])
def api_search_station():
    station_name = request.form['station_name']
    max_results = request.form.get('max_results', 5, type=int)
    station_names, station_info_map = get_station_names(api_key, station_name, max_results)
    
    if station_names and station_info_map:
        return jsonify({
            'station_names': station_names,
            'station_info_map': station_info_map
        })
    else:
        return jsonify({'error_message': f"No stations found for '{station_name}' or an error occurred."}), 404

@app.route('/departures/<station_id>')
def show_departures(station_id):
    departures, station_name = get_departure_board(api_key, station_id)

    if departures:
        departures_sorted = sorted(departures, key=lambda dep: dep['datetime'] if dep['datetime'] else datetime.max)
        return render_template('departures.html', departures=departures_sorted, station_name=station_name, station_id=station_id)
    else:
        error_message = "Failed to fetch departures from the API."
        return render_template('error.html', error_message=error_message)

@app.route('/api/departures/<station_id>', methods=['GET'])
def api_departures(station_id):
    departures, station_name = get_departure_board(api_key, station_id)

    if departures:
        departures_sorted = sorted(departures, key=lambda dep: dep['datetime'] if dep['datetime'] else datetime.max)
        return jsonify(departures=departures_sorted, station_name=station_name)
    else:
        error_message = "Failed to fetch departures from the API."
        return jsonify(error=error_message), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
