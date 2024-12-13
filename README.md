# Grafana:

**Docker Install Grafana**
https://grafana.com/docs/grafana/latest/setup-grafana/installation/docker/
```
docker volume create grafana-storage
```
```
docker run -d -p 666:3000 --name=grafana  --volume grafana-storage:/var/lib/grafana grafana/grafana-enterprise
```
**Docker Install Postgres**

```
docker volume create postgres-storage
```
```
docker run -p 5432:5432 --name postgres -e POSTGRES_PASSWORD=admin -e POSTGRES_USER=postgres -d postgres --volume postgres-storage:/var/lib/postgres
```

__Create Db__
```
createdb -U postgres grafana
```
sql:
```sql
CREATE TABLE public.routes (
    id uuid NOT NULL unique ,
    name character varying(255),
    duration: int,
    distance: int,
    date Date
);

CREATE TABLE public.route_points (
    id uuid NOT NULL unique ,
    route_id uuid NOT NULL,
    longitude float NOT NULL,
    latitude float NOT NULL,
    timestamp timestamp
);

alter table public.route_points 
add constraint fk_rt_points_route 
foreign key(route_id) references routes(id) 
on delete cascade;

CREATE TABLE public.speed_map (
    speed float NOT NULL default 0,
    longitude float NOT NULL,
    latitude float NOT NULL,
    amount_of_data_points int default 0
);
alter table public.speed_map
    add constraint pk_sm_long_lat
        primary key (latitude,longitude);


INSERT INTO routes(id,name,date)
VALUES ('ebe8b980-bc63-45bd-8cdd-c02f48feebdc', 'test', '2024-12-12');

INSERT INTO route_points(id, route_id,longitude, latitude, timestamp)
VALUES ('c8c3060c-783f-4cbb-9432-526e91b2d3f8','ebe8b980-bc63-45bd-8cdd-c02f48feebdc', 4.000,50.000, '2024-12-12T12:00:00');

INSERT INTO route_points(id, route_id,longitude, latitude, timestamp)
VALUES ('f3ba19f1-b675-485c-bf6b-9ebf7b629dfc','ebe8b980-bc63-45bd-8cdd-c02f48feebdc', 4.000,51.219448, '2024-12-12T12:01:00');

INSERT INTO route_points(id, route_id,longitude, latitude, timestamp)
VALUES ('6bb2437f-673d-4060-a5df-67af4281bcee','ebe8b980-bc63-45bd-8cdd-c02f48feebdc', 4.402464,51.219448, '2024-12-12T12:02:00');

INSERT INTO route_points(id, route_id,longitude, latitude, timestamp)
VALUES ('0524783a-7910-452e-8d3c-c827fe55d635','ebe8b980-bc63-45bd-8cdd-c02f48feebdc', 4.402464,50.000, '2024-12-12T12:03:00');

INSERT INTO route_points(id, route_id,longitude, latitude, timestamp)
VALUES ('73bc9446-1db5-47f4-a293-ac1e7a01a531','ebe8b980-bc63-45bd-8cdd-c02f48feebdc', 4.000,50.000, '2024-12-12T12:04:00');

INSERT INTO speed_map(longitude, latitude, speed, amount_of_data_points)
VALUES 
    ( 4.402464,51.219448, 120,1),
    ( 4.402465,51.219448, 100,1),
    ( 4.402466,51.219448, 10,1),
    ( 4.402467,51.219448, 0,1),
    ( 4.402468,51.219448, 180,1),
    ( 4.402469,51.219448, 120,1),
    ( 4.402470,51.219448, 120,1);
```

**Connect to Postgres in Grafana**
url: host.docker.internal:5432
database name: grafana

username: postgres
password: admin
TLS: disable

query: 
```sql
select pts.id as id, pts.longitude, pts.timestamp, pts.latitude, rt.name, rt.date, rt.id as route_id
from routes as rt 
join route_points pts on rt.id = pts.route_id
```