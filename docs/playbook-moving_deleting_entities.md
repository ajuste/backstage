# Moving & Deleting entities

## Moving from one location to another

1. Unregister current location
2. Add new location
3. If something is not showing correctly, then restart nomad instance


## Troubleshooting

### Unable to delete entity or still shows in catalog:

If you delete an entity and when you try to add it back 
it errors out the entity already exists, but you cannot see in the catalog:

1. Connect to the DB
2. Drop rows from the following tables:
   1. refresh_state_references: `target_entity_ref like '%name of the pillar%'`
   2. refresh_state: `entity_ref like '%name of the pillar%''`
   3. final_entities: `final_entity like '%name of the pillar%'`
3. Restart backstage in Nomad
4. Try adding back. It should work now.
5. If that doesn't work, also delete the original location form the Catalog using the advanced options and restart.
   1. Keep in mind you can also be deleting other entities.