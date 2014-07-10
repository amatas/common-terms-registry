function(doc) {
    if (doc) {
        if (doc && doc.type && (doc.type.toLowerCase() === 'operator') && doc.status !== "deleted") {
            emit(doc.uniqueId, require('views/lib/recordUtils').getRecordFields(doc));
        }
    }
}