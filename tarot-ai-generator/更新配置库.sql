-- SQLite
-- DELETE FROM dimension WHERE id IN (101);

-- DELETE FROM dimension_translation WHERE dimension_id IN (101);

DELETE from card_interpretation_dimension where dimension_id >= 110;
DELETE from card_interpretation_dimension_translation where dimension_interpretation_id not in (select id from card_interpretation_dimension);

-- DELETE FROM dimension WHERE id >= 95;
-- DELETE FROM dimension_translation WHERE dimension_id >= 95;

-- SELECT description from dimension where id = 107;

-- DELETE FROM card_interpretation_dimension_translation
-- WHERE dimension_id = 112;
