// Detect and display duplicates
"use strict";
module.exports = function(config) {
    var express = require('express');
    var router = express.Router();

    router.get("/", function(req,res) {
        var request = require("request");

        // Get the full list of unfiltered records from couch
        request.get(config['couch.url'] + "/_all_docs?include_docs=true", function(e,r,b) {
            if (e) {
                return res.send(500,{ "ok": "false", "message": "Error retrieving data from couch...", "error": e});
            }

            var data = JSON.parse(b);
            if (!data.rows) {
                return res.send(500,{ "ok": "false", "message": "No data was returned from couch..."});
            }


            // Page through and keep two maps by uniqueID, one of distinct scanned uniqueIDs, and one of dupes
            var firsts = {};
            var dupes = {};

            data.rows.forEach(function(row) {
                var doc = row.doc;
                if (row.id.indexOf("_design") === -1 && doc && doc.uniqueId) {
                    if (!firsts[doc.uniqueId]) {
                        firsts[doc.uniqueId] = doc;
                    }
                    else {
                        if (dupes[doc.uniqueId]) {
                            dupes[doc.uniqueId].push(doc);
                        }
                        else {
                            dupes[doc.uniqueId] = [firsts[doc.uniqueId], doc];
                        }
                    }
                }
            });

            // I didn't remember that dupes included all duplicates, and ended up purging a lot of content.  This needs to be rewritten to be smarter
//            var bulkDeleteOutput = { docs: [] };
//            Object.keys(dupes).forEach(function(key){
//                var entries = dupes[key];
//                entries.forEach(function(entry){
//                    bulkDeleteOutput.docs.push({
//                        "_id": entry._id,
//                        "_rev": entry._rev,
//                        "_deleted": true
//                    });
//                });
//            });

            // Present the list of duplicates
            res.send(200, dupes);
        });
    });

    return router;
};

