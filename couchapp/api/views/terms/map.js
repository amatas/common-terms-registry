function(doc) {
    if (doc) {
        if (doc && doc.type && doc.type.toLowerCase() == 'term' && doc.status !== "deleted") {
            emit(doc.uniqueId, require('views/lib/recordUtils').getRecordFields(doc));
        }
    }
}