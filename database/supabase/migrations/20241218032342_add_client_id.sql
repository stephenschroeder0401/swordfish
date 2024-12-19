delete from property_group_property;
delete from property_group_gl;
delete from property_group;


ALTER TABLE property_group 
    ADD COLUMN client_id UUID NOT NULL REFERENCES client(id);

CREATE INDEX idx_property_group_client_id ON property_group(client_id);
