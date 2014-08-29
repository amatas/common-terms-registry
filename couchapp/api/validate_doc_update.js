// TODO:  Phase this out in favor of JSON schema validation in express
// Rules that control what record content can be stored in Couch for the Common Terms Registry
function(newDoc, oldDoc, userCtx) {
    // The user has to be logged in to perform updates
    if (!userCtx || userCtx.name === null) {
        throw({"unauthorized" : {"summary": "You must be logged in to add or edit records."}});
    }
    else {
        // We only allow couch admins to perform actual deletes
        var errors = [];
        if(newDoc._deleted === true) {
            if (!userCtx.roles || userCtx.roles.indexOf("_admin") === -1) {
                errors.push({"message" : "Only admins are allowed to directly remove records."});
            }
        }
        else {
            var ValidTypes = [,"alias","transform","term","condition","translation"];
            var ValidStatus = ["active","unreviewed","candidate","deleted","draft"];

            if (!newDoc.type) {
                errors.push({"type" : "Record type is required."});
            }
            else {
                if (ValidTypes.indexOf(newDoc.type) === -1) {
                    errors.push({"type" : "Record type '" + newDoc.type + " is not valid."});
                }
            }

            if (!newDoc.status) {
                errors.push({"status" : "Status is required."});
            }
            else {
                if (ValidStatus.indexOf(newDoc.status) === -1) {
                    errors.push({"status" : "Status '" + newDoc.status + "' is not valid."});
                }
            }

            // The uniqueId can never be null
            if (!newDoc.uniqueId) {
                errors.push({"uniqueId" : "Unique ID is required."});
            }
            else {
                // if this is a term, the uniqueId must be in lowerCamelCase
                if (newDoc.type && newDoc.type === "term" && !isLowerCamelCase(newDoc.uniqueId)) {
                    errors.push({"uniqueId" : "Unique ID '" + newDoc.uniqueId + "' is not in lowerCamelCase."});
                }
            }

            // if this is a term, the definition must not be null
            if (!newDoc.definition && newDoc.type && newDoc.type === "term") {
                errors.push({"definition" : "Terms must have a definition."});
            }

            // if this is an alias or transform, a definition is not allowed
            if (newDoc.definition && newDoc.type && (newDoc.type === "alias" || newDoc.type === "transform") ) {
                errors.push({"definition" : "Aliases and transformations are not allowed to have a definition."});
            }

            // if this is not a term, no defaultValue is allowed
            if (newDoc.defaultValue && newDoc.type && newDoc.type !== "term") {
                errors.push({"defaultValue" : "Default values are only allowed for terms."});
            }

            // if the record type is ALIAS or TRANSFORMATION, the aliasOf field must not be null and must be in lowerCamelCase
            if (newDoc.type === "transform" || newDoc.type === "alias") {
                if (!newDoc.aliasOf) {
                    errors.push({"aliasOf" : "The aliasOf field cannot be empty for an alias."});
                }
                else if (!isLowerCamelCase(newDoc.aliasOf)) {
                    errors.push({"aliasOf" : "The aliasOf field must be in lowerCamelCase."});
                }
            }
            else {
                // if the record type is not an ALIAS or TRANSFORMATION, the aliasOf field is not allowed
                if (newDoc.aliasOf) {
                    errors.push({"aliasOf" : "The aliasOf field is only allowed for aliases."});
                }
            }

            // if the record type is TRANSLATION, the translationOf field must not be null and must be in lowerCamelCase
            if (newDoc.type === "translation") {
                if (!newDoc.translationOf) {
                    errors.push({"translationOf" : "The translationOf field cannot be empty for a translation."});
                }
                else if (!isLowerCamelCase(newDoc.translationOf)) {
                    errors.push({"translationOf" : "The translationOf field must be in lowerCamelCase."});
                }
            }
            else {
                // if the record type is not a TRANSLATION, the translationOf field is not allowed
                if (newDoc.translationOf) {
                    errors.push({"translationOf" : "The translationOf field is only allowed for aliases."});
                }
            }

            // if the record type is an alias or transform, valueSpace is not allowed
            if (newDoc.valueSpace && newDoc.type && ( newDoc.type === "alias" || newDoc.type === "transform" )) {
                errors.push({"valueSpace" : "The valueSpace field not allowed for aliases or transformations."});
            }

            // if the record type is OPERATOR, a termLabel is not allowed
            if (newDoc.termLabel && newDoc.type && newDoc.type === "condition") {
                errors.push({"termLabel" : "The termLabel field not allowed for conditions."});
            }

            // If this is not a translation or term, the applicationUniqueFlag is not allowed
            if (newDoc.applicationUniqueField && newDoc.type && ( newDoc.type !== "translation" && newDoc.type !== "term" )) {
                errors.push({"applicationUniqueField" : "The applicationUniqueField is only allowed for translations and terms."});
            }
            // If the record type is OPERATOR, the uses field is not allowed
            if (newDoc.uses && newDoc.type && newDoc.type === "condition") {
                errors.push({"uses" : "Conditions are not allowed to have usage information."});
            }

            // For versioning, we require two things
            // 1) The version data must always be updated when a record is edited
            // 2) Existing version data must be retained

            // If there are any validation errors, throw them all at once for validation
            if (errors.length > 0) {
                throw({ "forbidden" : {
                    "summary":  "There were one or more errors with the data you submitted.  Please review..." + newDoc._deleted === true,
                    "errors" :  errors,
                    "current" : oldDoc,
                    "new" :     newDoc
                }});
            }
        }
    }
}

function isLowerCamelCase(string) {
    if (string.match(/^([a-z0-9]+(([0-9]|[A-Z])[a-z]*){0,})$/)) return true;

    return false;
}