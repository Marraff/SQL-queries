const express = require('express');
const app = express();
const pool = require('./connect.js');

app.use(express.json());

app.get('/v1/health', async(req,res)=>{
    try{
        const verzia = await pool.query("SELECT VERSION();");
        prvy = verzia.rows
        const velkost = await pool.query(`SELECT pg_database_size('dota2')/1024/1024 as dota2_db_size;`);
        druhy = velkost.rows

        prvy = prvy[0]
        druhy[0].dota2_db_size = parseInt(druhy[0].dota2_db_size)
        druhy = druhy[0]
        let spolu = Object.assign(prvy,druhy)
        let oba = Object.assign({"pgsql": spolu})

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(oba,null,2));

    }catch{
        console.error(err.message);
    }
});

app.get('/v2/patches', async(req,res) => {
 
    var celok = {};
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(celok,null,2));  
    
});

app.get('/v2/players/:player_id/game_exp', async(req,res) => {
 
    var idcko  = req.params;        // zistenie hracovho id z url adresy
    idcko = parseInt(idcko.player_id);

    try{
        
        const info2 = await pool.query(`SELECT COALESCE(players.nick,'Unknown') AS nick, 
                                        players.id AS player_id,

                                        (CASE WHEN matches_players_details.xp_hero is null THEN 0 ELSE matches_players_details.xp_hero END)
                                        + (CASE WHEN matches_players_details.xp_creep is null THEN 0 ELSE matches_players_details.xp_creep END)
                                        + (CASE WHEN matches_players_details.xp_other is null THEN 0 ELSE matches_players_details.xp_other END)
                                        + (CASE WHEN matches_players_details.xp_roshan is null THEN 0 ELSE matches_players_details.xp_roshan END)
                                        AS experience_gained,
                                        
                                        matches_players_details.hero_id, matches_players_details.level, matches_players_details.match_id,
                                        
                                        CAST(ROUND((matches.duration +0.0)/60,2) AS FLOAT) AS duration,
                                        matches.id AS matches_id, 
                                        
                                        (CASE 
                                            WHEN  matches_players_details.player_slot BETWEEN 128 AND 132 THEN
                                                (CASE
                                                    WHEN matches.radiant_win is true THEN matches.radiant_win is false 
                                                    ELSE matches.radiant_win is false END)
                                            ELSE matches.radiant_win END) AS radiant_win,
                                        heroes.localized_name

                                        FROM players, matches_players_details, matches, heroes

                                        WHERE players.id = 14944 AND matches_players_details.player_id = 14944 AND matches_players_details.match_id = match_id AND matches.id = match_id AND heroes.id = hero_id
                                        ORDER BY match_id`);

        var info = info2.rows;          //vytvorenie pomocnych premennych 
        var pole = info[0];
        var experiences_gained;
        var match_duration_minutes;
        var match_id;
        var hero_localized_name;
        var level_gained;
        var winner;
        var player_slot;

        var celok = {"id": pole.player_id, "player_nick":pole.nick, "matches": []};     //vytvorenie objektu do ktoreho sa budu ukladat udaje

        for (i = 0 ;i<info.length;i++){             //for cyklus v ktorom sa do pola v objekte celok pridavaju informacie o jednotlyvych hrach

             experiences_gained = info[i].experience_gained;        //zistenie konkretnych udajov
             match_duration_minutes = info[i].duration;
             match_id = info[i].matches_id;
             hero_localized_name = info[i].localized_name;
             level_gained = info[i].level;
             winner = info[i].radiant_win;
             player_slot = info[i].player_slot;

            // pridanie udajov do objektu v poli
            celok.matches.push({"match_id":match_id,"hero_localized_name":hero_localized_name,"match_duration_minutes": match_duration_minutes,"experiences_gained": experiences_gained, "level_gained": level_gained,"winner": winner});
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });     //do hlavicky sa zapise info 200 ok a info o tom ze to je application/json
        res.end(JSON.stringify(celok,null,2));              // odoslanie udajov v spravnom formate
    }
    catch{
        console.error(err.message);         // v pripade chyby vypise chybovu hlasku
    }
});

app.get('/v2/players/:player_id/game_objectives', async(req,res) => {

    var idcko  = req.params;    // zistenie hracovho id z url adresy
    idcko = parseInt(idcko.player_id);
    
    try{
        
        const info2 = await pool.query(`SELECT players.id,
                                         COALESCE(players.nick,'Unknown') AS nick,
                                         matches.id AS matches_id, 
                                         matches_players_details.hero_id,
                                         heroes.localized_name,
                                         COALESCE(game_objectives.subtype, 'NO_ACTION') AS subtype
                                                                           
                                         FROM players, matches, heroes, matches_players_details, game_objectives
                                         
                                         WHERE players.id = ${idcko} AND matches_players_details.player_id = ${idcko} 
                                         AND matches.id = matches_players_details.match_id AND heroes.id = hero_id 
                                         AND game_objectives.match_player_detail_id_1 = matches_players_details.id
                                         ORDER BY match_id`);
                                         
        var info = info2.rows;      //vytvorenie pomocnych premennych 
        console.log(info)
        var pole = info[0];
        var match_id = pole.matches_id;
        var hero_localized_name = pole.localized_name;

        var count = 0;
    
        var celok = {"id": pole.id, "player_nick":pole.nick, "matches": []};        //vytvorenie objektu do ktoreho sa budu ukladat udaje

        for (i = 0 ;i<info.length;i++){         //for cyklus v ktorom sa do pola v objekte celok pridavaju informacie o jednotlyvych hrach

            var match_id = info[i].matches_id;
            var hero_localized_name = info[i].localized_name;
            var subtype = info[i].subtype;

            // pridanie udajov do objektu v poli
            celok.matches.push({"match_id":match_id,"hero_localized_name":hero_localized_name, "actions": [{"hero_action":subtype,"count":count}]});

        }
        res.writeHead(200, { 'Content-Type': 'application/json' });         //do hlavicky sa zapise info 200 ok a info o tom ze to je application/json
        res.end(JSON.stringify(celok,null,2));                           // odoslanie udajov v spravnom formate
   
    }
    catch{
        console.error(err.message);         // v pripade chyby vypise chybovu hlasku
    }
    
    
});

app.get('/v2/players/:player_id/abilities', async(req,res) => {

    var idcko  = req.params;                 // zistenie hracovho id z url adresy
    idcko = parseInt(idcko.player_id);

    try{
        
        const info2 = await pool.query(`SELECT players.id,
                                        COALESCE(players.nick,'Unknown') AS nick,
                                        matches.id AS matches_id,
                                        matches_players_details.hero_id,
                                        heroes.localized_name,
                                        abilities.name AS ability_name, ability_upgrades.level                    
                                                                        
                                        FROM players, matches, heroes, matches_players_details, ability_upgrades, abilities
                                        WHERE players.id = ${idcko} AND matches_players_details.player_id = ${idcko} AND matches.id = matches_players_details.match_id AND heroes.id = hero_id 
                                        AND ability_upgrades.match_player_detail_id = matches_players_details.id 
                                        AND abilities.id = ability_upgrades.ability_id
                                        ORDER BY match_id`);
            
        var info = info2.rows;                  //vytvorenie pomocnych premennych 
        var pole = info[0];
        var match_id = pole.matches_id;
        var hero_localized_name = pole.localized_name;

        var count = 0;

        var celok = {"id": pole.id, "player_nick":pole.nick, "matches": []};            //vytvorenie objektu do ktoreho sa budu ukladat udaje

        for (i = 0 ;i<info.length;i++){      //for cyklus v ktorom sa do pola v objekte celok pridavaju informacie o jednotlyvych hrach

            var match_id = info[i].matches_id;
            var hero_localized_name = info[i].localized_name;
            var ability_name = info[i].ability_name;
            var level = info[i].level;
        
            // pridanie udajov do objektu v poli
            celok.matches.push({"match_id":match_id,"hero_localized_name":hero_localized_name, "abilities": [{"ability_name":ability_name,"count":count, "upgrade_level":level}]});

        }
        res.writeHead(200, { 'Content-Type': 'application/json' });         //do hlavicky sa zapise info 200 ok a info o tom ze to je application/json
        res.end(JSON.stringify(celok,null,2));                      // odoslanie udajov v spravnom formate
   
    }
    catch{
        console.error(err.message);         // v pripade chyby vypise chybovu hlasku
    }
    
    
});

app.listen(8080, ()=>{                          //spustenie servera               
    console.log('Server running at port 8080');
})