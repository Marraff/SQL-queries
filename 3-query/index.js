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

app.get('/v3/matches/:match_id/top_purchases', async(req,res) => {
    var match_id  = req.params;                 // zistenie  id hry z url adresy
    match_id = parseInt(match_id.match_id);

    const info = await pool.query(`SELECT DISTINCT
                                    matches.id AS match_id,
                                    matches_players_details.id AS player_id, 
                                    matches_players_details.hero_id AS hero_id,
                                    heroes.localized_name AS hero_name,
                                    purchase_logs.item_id AS item_id, 
                                    items.name AS item_name,
                                    CAST (COUNT(purchase_logs.item_id) AS INT) AS count
                                    
                                    FROM matches 
                                    
                                    JOIN  matches_players_details ON
                                    matches_players_details.match_id = matches.id 
                                    AND 
                                    ((matches.radiant_win IS true AND matches_players_details.player_slot BETWEEN 0 AND 4)
                                    OR
                                    (matches.radiant_win IS false AND matches_players_details.player_slot BETWEEN 128 AND 132))
                                    JOIN heroes ON heroes.id = matches_players_details.hero_id
                                    JOIN purchase_logs ON matches_players_details.id = purchase_logs.match_player_detail_id
                                    JOIN items ON purchase_logs.item_id = items.id 
                                    
                                    WHERE matches.id = ${match_id}
                                    
                                    GROUP BY 
                                    matches.id,
                                    matches_players_details.id, 
                                    matches_players_details.hero_id,
                                    heroes.localized_name,
                                    purchase_logs.item_id, 
                                    items.name
                                    
                                    ORDER BY matches_players_details.hero_id, count DESC, items.name `);
    var info2 = info.rows;  
    var heroes_name = [];
    var heroes_id = [];
    var heroes_items_name = [];
    var heroes_items_id = [];
    var heroes_items_count = [];
    var pocitadlo = 0;
    var dlzka = info2.length-1;

    var celok = {"id": info2[0].match_id, "heroes":[]};

    for (i=0;i<info2.length;i++){  
        if( !heroes_name.includes(info2[i].hero_name) ){    
            heroes_name.push(info2[i].hero_name);
            heroes_id.push(info2[i].hero_id);
        }
    }

    for (i=0;i<heroes_name.length;i++){
        celok.heroes.push({"id": heroes_id[i],"name": heroes_name[i], "top_purchases": []});
    }

    for (i=0;i<info2.length;i++){ 
        if (i<dlzka){
            if (info2[i].hero_id == info2[i+1].hero_id){
                pocitadlo += 1;
            }
        }
        if (pocitadlo < 6 && i<dlzka){

            heroes_items_name.push(info2[i].item_name);
            heroes_items_id.push(info2[i].item_id);
            heroes_items_count.push(info2[i].count);
            
        }
        if (i<dlzka){
            if (info2[i].hero_id != info2[i+1].hero_id){
                pocitadlo = 0;
            }
        }
    }
   
    for (i=0;i<heroes_items_count.length;i++){
        
        if ( i < 5){
            celok.heroes[0].top_purchases.push({"id": heroes_items_id[i],"name": heroes_items_name[i],"count": heroes_items_count[i]});
          
        }
        if ( i > 4 && i < 10 ){
            celok.heroes[1].top_purchases.push({"id": heroes_items_id[i],"name": heroes_items_name[i],"count": heroes_items_count[i]});
          
        }
        if (9 < i && i < 15){
            celok.heroes[2].top_purchases.push({"id": heroes_items_id[i],"name": heroes_items_name[i],"count": heroes_items_count[i]});
           
        }
        if (14 < i && i < 20){
            celok.heroes[3].top_purchases.push({"id": heroes_items_id[i],"name": heroes_items_name[i],"count": heroes_items_count[i]});
            
        }
        if (i > 19){
            celok.heroes[4].top_purchases.push({"id": heroes_items_id[i],"name": heroes_items_name[i],"count": heroes_items_count[i]});
        }
        
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });     //do hlavicky sa zapise info 200 ok a info o tom ze to je application/json
    res.end(JSON.stringify(celok,null,2));

});

app.get('/v3/abilities/:ability_id/usage/', async(req,res) => {
    var ability_id  = req.params;                 // zistenie  id hry z url adresy
    ability_id = parseInt(ability_id.ability_id);
    console.log(ability_id)

    const info = await pool.query(`SELECT 

                                    abilities.id AS id, 
                                    abilities.name AS ability_name,
                                    matches_players_details.hero_id AS hero_id,
                                    heroes.localized_name AS hero_name,
                                    
                                    CASE 
                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 1 THEN '0-9' 
                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 2 THEN '10-19'
                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 3 THEN '20-29' 
                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 4 THEN '30-39'
                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 5 THEN '40-49' 
                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 6 THEN '50-59'
                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 7 THEN '60-69' 
                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 8 THEN '70-79'
                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 9 THEN '80-89' 
                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 10 THEN '90-99'
                                    ELSE 
                                        '100-109' 
                                    END AS bucket,
                                    
                                    matches.radiant_win AS winner,
                                    CAST((COUNT(*) OVER(PARTITION BY 
                                                    matches_players_details.hero_id, 
                                                    CASE 
                                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 1 THEN '0-9' 
                                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 2 THEN '10-19'
                                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 3 THEN '20-29' 
                                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 4 THEN '30-39'
                                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 5 THEN '40-49' 
                                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 6 THEN '50-59'
                                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 7 THEN '60-69' 
                                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 8 THEN '70-79'
                                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 9 THEN '80-89' 
                                                        WHEN (CEILING((ability_upgrades.time+0.0)/((matches.duration+0.0)/11.0))) = 10 THEN '90-99'
                                                    ELSE 
                                                        '100-109' 
                                                    END,
                                                    CASE 
                                                    WHEN  matches_players_details.player_slot BETWEEN 128 AND 132 THEN
                                                        (CASE
                                                            WHEN matches.radiant_win is true THEN matches.radiant_win is false 
                                                            WHEN matches.radiant_win is false THEN matches.radiant_win is true 
                                                            
                                                            END)
                                                    ELSE matches.radiant_win 
                                                    END
                                                ORDER BY matches_players_details.hero_id
                                                )) AS INT ) AS count
                                    
                                    FROM abilities 
                                    
                                    JOIN ability_upgrades 
                                    ON ability_upgrades.ability_id = abilities.id
                                    
                                    JOIN matches_players_details
                                    ON matches_players_details.id = ability_upgrades.match_player_detail_id
                                    JOIN heroes
                                    ON matches_players_details.hero_id = heroes.id
                                    JOIN matches 
                                    ON matches.id = matches_players_details.match_id
                                    AND 
                                    (CASE 
                                        WHEN  matches_players_details.player_slot BETWEEN 128 AND 132 THEN
                                            (CASE
                                                WHEN matches.radiant_win is true THEN matches.radiant_win is false 
                                                ELSE matches.radiant_win is false END)
                                        ELSE matches.radiant_win END)
                                    
                                    
                                    WHERE abilities.id =  ${ability_id}
                                    
                                    
                                    GROUP BY
                                    abilities.id, 
                                    abilities.name,
                                    ability_upgrades.match_player_detail_id,
                                    ability_upgrades.time,
                                    matches_players_details.hero_id,
                                    matches_players_details.player_slot,
                                    matches.radiant_win,
                                    matches.duration,
                                    heroes.localized_name
                                    
                                    ORDER BY matches_players_details.hero_id DESC`);
    var info2 = info.rows;  
    var ability_array = [{}];
    var pomocne_pole = [];

    var celok = {"id": info2[0].id,"name": info2[0].ability_name, "heroes":[]};

    for (i=0;i<info2.length;i++){  
        ability_array.push({"hero_id": info2[i].hero_id, "hero_name": info2[i].hero_name, "bucket": info2[i].bucket,"winner": info2[i].winner,"count": info2[i].count});
    }

    for (i=0;i<info2.length-1;i++){  
        if( ability_array[i].hero_id == ability_array[i+1].hero_id &&  ability_array[i].hero_name== ability_array[i+1].hero_name && ability_array[i].bucket == ability_array[i+1].bucket && ability_array[i].winner == ability_array[i+1].winner){    
            
        }
        else{
            pomocne_pole.push({"id": info2[i].hero_id, "name": info2[i].hero_name,"winner": info2[i].winner, "bucket": info2[i].bucket, "count": info2[i].count});
         
        }
    }

    var dlzka = pomocne_pole.length;
    var pom = {"count": 0};
    var pom2 = {"count": 0};
    var pom3;

    for (i=0;i<pomocne_pole.length-1;i++){

        if (pomocne_pole[i].id == pomocne_pole[i+1].id){
            
            if (pomocne_pole[i].winner == true){
                if (pom.count < pomocne_pole[i].count){
                    pom = pomocne_pole[i];
                }
            }
            
            if (pomocne_pole[i].winner == false){
                if (pom2.count < pomocne_pole[i].count){
                    pom2 = pomocne_pole[i];
          
                }
            }
        }
        
        else{
            if (pomocne_pole[i].winner == true){
                pom3=({"id": pomocne_pole[i].id, "name": pomocne_pole[i].name,"usage_winners":{ "bucket": pomocne_pole[i].bucket, "count": pomocne_pole[i].count}});
            }
            else{
                cpom3=({"id": pomocne_pole[i].id, "name": pomocne_pole[i].name,"usage_loosers":{ "bucket": pomocne_pole[i].bucket, "count": pomocne_pole[i].count}});
            }
            
        }


    }

    celok.heroes.push({"id": pom.id, "name": pom.name,"usage_winners":{ "bucket": pom.bucket, "count": pom.count},"usage_loosers":{ "bucket": pom2.bucket, "count": pom2.count}});
    celok.heroes.push(pom3)     

    res.writeHead(200, { 'Content-Type': 'application/json' });     //do hlavicky sa zapise info 200 ok a info o tom ze to je application/json
    res.end(JSON.stringify(celok,null,2));

});

app.get('/v3/statistics/tower_kills/', async(req,res) => {  

    const info = await pool.query(`SELECT 

                                    heroes.id, 
                                    heroes.localized_name, 
                                    (COUNT(game_objectives.subtype) )AS count
                                    
                                    FROM heroes
                                    
                                    JOIN matches_players_details
                                    ON matches_players_details.hero_id = heroes.id
                                    JOIN game_objectives
                                    ON matches_players_details.id = game_objectives.match_player_detail_id_1
                                    
                                    WHERE game_objectives.subtype = 'CHAT_MESSAGE_TOWER_KILL' 
                                    
                                    GROUP BY 
                                    heroes.id,
                                    heroes.localized_name,
                                    game_objectives.subtype,
                                    matches_players_details.id
                                    
                                    ORDER BY count DESC, heroes.id 
                                    `);
    var info2 = info.rows;  
    var idcko = [];
    var pom = []

    var celok = {"heroes":[]};

    for (i=0;i<info2.length;i++){  
        if( !idcko.includes(info2[i].id) && info2[i].count >1 ){  
            idcko.push(info2[i].id);  
            celok.heroes.push({"id":info2[i].id,"name": info2[i].localized_name, "tower_kills": info2[i].count});
            
        }
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });     //do hlavicky sa zapise info 200 ok a info o tom ze to je application/json
    res.end(JSON.stringify(celok,null,2));

});


app.listen(8080, ()=>{                          //spustenie servera               
    console.log('Server running at port 8080');
});
