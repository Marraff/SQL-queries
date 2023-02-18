CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "created_at" timestamp,
  "nick_name" varchar
);

CREATE TABLE "registration" (
  "id" SERIAL PRIMARY KEY,
  "name" varchar NOT NULL,
  "surname" varchar NOT NULL,
  "password" varchar NOT NULL,
  "email" varchar NOT NULL,
  "user_id" int
);

CREATE TABLE "invitation" (
  "id" SERIAL PRIMARY KEY,
  "user_id" int,
  "accept" boolean
);

CREATE TABLE "team" (
  "id" SERIAL PRIMARY KEY,
  "invitation_id" int
);

CREATE TABLE "friendship" (
  "id" SERIAL PRIMARY KEY,
  "invitation_id" int
);

CREATE TABLE "chat_friends" (
  "id" int PRIMARY KEY,
  "friendship_id" int
);

CREATE TABLE "chat_team" (
  "id" int PRIMARY KEY,
  "team_id" int
);

CREATE TABLE "message_friends" (
  "id" int PRIMARY KEY,
  "chat_id" int,
  "message" text,
  "time" date
);

CREATE TABLE "message_team" (
  "id" int PRIMARY KEY,
  "chat_id" int,
  "message" text,
  "time" date
);

CREATE TABLE "game" (
  "id" SERIAL PRIMARY KEY,
  "date" date,
  "player_id" int,
  "name" varchar
);

CREATE TABLE "levelSystem" (
  "id" SERIAL PRIMARY KEY,
  "game_id" int
);

CREATE TABLE "matches" (
  "id" SERIAL PRIMARY KEY,
  "game_id" int
);

CREATE TABLE "events" (
  "id" SERIAL PRIMARY KEY,
  "matches_id" int,
  "description" varchar
);

CREATE TABLE "characters" (
  "id" SERIAL PRIMARY KEY,
  "game_id" int,
  "character_name" varchar
);

CREATE TABLE "skillset" (
  "id" SERIAL PRIMARY KEY,
  "character_name" varchar
);

CREATE TABLE "skills" (
  "id" SERIAL PRIMARY KEY,
  "skillset_id" int
);

CREATE TABLE "roles" (
  "id" int PRIMARY KEY,
  "characters_id" int,
  "role_name" varchar
);

CREATE TABLE "capabilities" (
  "id" SERIAL PRIMARY KEY,
  "roles_id" int,
  "capability_name" varchar
);

CREATE TABLE "inventory" (
  "id" int PRIMARY KEY,
  "characters_id" int,
  "full" boolean,
  "places" int
);

CREATE TABLE "items" (
  "id" SERIAL PRIMARY KEY,
  "inventory_id" int,
  "name" varchar,
  "description" text
);

CREATE TABLE "tasks" (
  "id" SERIAL PRIMARY KEY,
  "characters_id" int,
  "name" varchar,
  "description" text
);

CREATE TABLE "task_parameters" (
  "id" SERIAL PRIMARY KEY,
  "tasks_id" int,
  "name" varchar,
  "exp" int,
  "skill" int
);

CREATE TABLE "character_parameters" (
  "id" SERIAL PRIMARY KEY,
  "characters_id" int,
  "level" int,
  "exp" int
);

CREATE TABLE "map" (
  "id" SERIAL PRIMARY KEY,
  "game_id" int,
  "name" varchar,
  "size" int
);

CREATE TABLE "floors" (
  "id" SERIAL PRIMARY KEY,
  "map_id" int,
  "name" varchar
);

CREATE TABLE "monsters" (
  "id" SERIAL PRIMARY KEY,
  "floors_id" int,
  "name" varchar
);

CREATE TABLE "monsters_parameters" (
  "id" SERIAL PRIMARY KEY,
  "monsters_id" int,
  "exp" int,
  "level" int,
  "weapon" varchar
);

ALTER TABLE "registration" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "invitation" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "team" ADD FOREIGN KEY ("invitation_id") REFERENCES "invitation" ("id");

ALTER TABLE "friendship" ADD FOREIGN KEY ("invitation_id") REFERENCES "invitation" ("id");

ALTER TABLE "message_friends" ADD FOREIGN KEY ("chat_id") REFERENCES "chat_friends" ("id");

ALTER TABLE "message_team" ADD FOREIGN KEY ("chat_id") REFERENCES "chat_team" ("id");

ALTER TABLE "chat_friends" ADD FOREIGN KEY ("friendship_id") REFERENCES "friendship" ("id");

ALTER TABLE "chat_team" ADD FOREIGN KEY ("team_id") REFERENCES "team" ("id");

ALTER TABLE "levelSystem" ADD FOREIGN KEY ("game_id") REFERENCES "game" ("id");

ALTER TABLE "matches" ADD FOREIGN KEY ("game_id") REFERENCES "game" ("id");

ALTER TABLE "game" ADD FOREIGN KEY ("player_id") REFERENCES "users" ("id");

ALTER TABLE "events" ADD FOREIGN KEY ("matches_id") REFERENCES "matches" ("id");

ALTER TABLE "skillset" ADD FOREIGN KEY ("character_name") REFERENCES "characters" ("character_name");

ALTER TABLE "skills" ADD FOREIGN KEY ("skillset_id") REFERENCES "skillset" ("id");

ALTER TABLE "characters" ADD FOREIGN KEY ("game_id") REFERENCES "game" ("id");

ALTER TABLE "roles" ADD FOREIGN KEY ("characters_id") REFERENCES "characters" ("id");

ALTER TABLE "capabilities" ADD FOREIGN KEY ("roles_id") REFERENCES "roles" ("id");

ALTER TABLE "items" ADD FOREIGN KEY ("inventory_id") REFERENCES "inventory" ("id");

ALTER TABLE "inventory" ADD FOREIGN KEY ("characters_id") REFERENCES "characters" ("id");

ALTER TABLE "tasks" ADD FOREIGN KEY ("characters_id") REFERENCES "characters" ("id");

ALTER TABLE "task_parameters" ADD FOREIGN KEY ("tasks_id") REFERENCES "tasks" ("id");

ALTER TABLE "character_parameters" ADD FOREIGN KEY ("characters_id") REFERENCES "characters" ("id");

ALTER TABLE "map" ADD FOREIGN KEY ("game_id") REFERENCES "game" ("id");

ALTER TABLE "floors" ADD FOREIGN KEY ("map_id") REFERENCES "map" ("id");

ALTER TABLE "monsters" ADD FOREIGN KEY ("floors_id") REFERENCES "floors" ("id");

ALTER TABLE "monsters_parameters" ADD FOREIGN KEY ("monsters_id") REFERENCES "monsters" ("id");
