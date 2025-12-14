| table_name                 | column_name                 | data_type                | is_nullable | column_default     |
| -------------------------- | --------------------------- | ------------------------ | ----------- | ------------------ |
| affiliate_dashboard        | affiliate_id                | uuid                     | YES         | null               |
| affiliate_dashboard        | affiliate_name              | text                     | YES         | null               |
| affiliate_dashboard        | affiliate_code              | text                     | YES         | null               |
| affiliate_dashboard        | customers_referred          | bigint                   | YES         | null               |
| affiliate_dashboard        | total_orders                | bigint                   | YES         | null               |
| affiliate_dashboard        | total_order_value           | bigint                   | YES         | null               |
| affiliate_dashboard        | total_discount_given        | bigint                   | YES         | null               |
| affiliate_dashboard        | total_commission_earned     | bigint                   | YES         | null               |
| affiliate_dashboard        | avg_order_value             | numeric                  | YES         | null               |
| affiliate_dashboard        | partnership_started         | timestamp with time zone | YES         | null               |
| affiliate_dashboard        | last_order_at               | timestamp with time zone | YES         | null               |
| campuses                   | id                          | uuid                     | NO          | uuid_generate_v4() |
| campuses                   | name                        | text                     | NO          | null               |
| campuses                   | code                        | text                     | NO          | null               |
| campuses                   | hotspot_location            | text                     | NO          | null               |
| campuses                   | latitude                    | numeric                  | NO          | null               |
| campuses                   | longitude                   | numeric                  | NO          | null               |
| campuses                   | is_active                   | boolean                  | YES         | true               |
| campuses                   | created_at                  | timestamp with time zone | YES         | now()              |
| campuses                   | updated_at                  | timestamp with time zone | YES         | now()              |
| cart                       | id                          | uuid                     | NO          | uuid_generate_v4() |
| cart                       | customer_id                 | uuid                     | NO          | null               |
| cart                       | pool_id                     | uuid                     | NO          | null               |
| cart                       | created_at                  | timestamp with time zone | YES         | now()              |
| cart                       | updated_at                  | timestamp with time zone | YES         | now()              |
| cart_items                 | id                          | uuid                     | NO          | uuid_generate_v4() |
| cart_items                 | cart_id                     | uuid                     | NO          | null               |
| cart_items                 | restaurant_id               | uuid                     | NO          | null               |
| cart_items                 | dish_id                     | uuid                     | NO          | null               |
| cart_items                 | quantity                    | integer                  | NO          | null               |
| cart_items                 | price                       | integer                  | NO          | null               |
| cart_items                 | special_instructions        | text                     | YES         | null               |
| cart_items                 | created_at                  | timestamp with time zone | YES         | now()              |
| cart_items                 | updated_at                  | timestamp with time zone | YES         | now()              |
| cart_summary               | cart_id                     | uuid                     | YES         | null               |
| cart_summary               | customer_id                 | uuid                     | YES         | null               |
| cart_summary               | pool_id                     | uuid                     | YES         | null               |
| cart_summary               | pool_name                   | text                     | YES         | null               |
| cart_summary               | campus_id                   | uuid                     | YES         | null               |
| cart_summary               | restaurant_count            | bigint                   | YES         | null               |
| cart_summary               | item_count                  | bigint                   | YES         | null               |
| cart_summary               | total_quantity              | bigint                   | YES         | null               |
| cart_summary               | cart_subtotal               | bigint                   | YES         | null               |
| cart_summary               | delivery_fee_per_order      | integer                  | YES         | null               |
| cart_summary               | created_at                  | timestamp with time zone | YES         | null               |
| cart_summary               | updated_at                  | timestamp with time zone | YES         | null               |
| customer_addresses         | id                          | uuid                     | NO          | uuid_generate_v4() |
| customer_addresses         | customer_id                 | uuid                     | NO          | null               |
| customer_addresses         | campus_id                   | uuid                     | NO          | null               |
| customer_addresses         | label                       | text                     | YES         | 'Default'::text    |
| customer_addresses         | hostel_block                | text                     | NO          | null               |
| customer_addresses         | room_number                 | text                     | NO          | null               |
| customer_addresses         | floor                       | text                     | YES         | null               |
| customer_addresses         | landmark                    | text                     | YES         | null               |
| customer_addresses         | phone                       | text                     | YES         | null               |
| customer_addresses         | delivery_instructions       | text                     | YES         | null               |
| customer_addresses         | is_default                  | boolean                  | YES         | false              |
| customer_addresses         | created_at                  | timestamp with time zone | YES         | now()              |
| customer_addresses         | updated_at                  | timestamp with time zone | YES         | now()              |
| customer_order_history     | customer_id                 | uuid                     | YES         | null               |
| customer_order_history     | order_id                    | uuid                     | YES         | null               |
| customer_order_history     | pool_id                     | uuid                     | YES         | null               |
| customer_order_history     | pool_name                   | text                     | YES         | null               |
| customer_order_history     | restaurant_id               | uuid                     | YES         | null               |
| customer_order_history     | restaurant_name             | text                     | YES         | null               |
| customer_order_history     | restaurant_image            | text                     | YES         | null               |
| customer_order_history     | items                       | jsonb                    | YES         | null               |
| customer_order_history     | total                       | integer                  | YES         | null               |
| customer_order_history     | status                      | text                     | YES         | null               |
| customer_order_history     | payment_status              | text                     | YES         | null               |
| customer_order_history     | ordered_at                  | timestamp with time zone | YES         | null               |
| customer_order_history     | delivered_at                | timestamp with time zone | YES         | null               |
| customer_order_history     | item_count                  | bigint                   | YES         | null               |
| customer_orders            | id                          | uuid                     | NO          | uuid_generate_v4() |
| customer_orders            | pool_id                     | uuid                     | NO          | null               |
| customer_orders            | customer_id                 | uuid                     | NO          | null               |
| customer_orders            | restaurant_id               | uuid                     | YES         | null               |
| customer_orders            | items                       | jsonb                    | NO          | null               |
| customer_orders            | total                       | integer                  | NO          | null               |
| customer_orders            | payment_status              | text                     | YES         | 'pending'::text    |
| customer_orders            | payment_id                  | text                     | YES         | null               |
| customer_orders            | status                      | text                     | YES         | 'pooling'::text    |
| customer_orders            | synced_to_fleetbase         | boolean                  | YES         | false              |
| customer_orders            | created_at                  | timestamp with time zone | YES         | now()              |
| customer_orders            | updated_at                  | timestamp with time zone | YES         | now()              |
| customer_orders            | subtotal                    | integer                  | YES         | 0                  |
| customer_orders            | delivery_fee                | integer                  | YES         | 0                  |
| customer_orders            | platform_fee                | integer                  | YES         | 0                  |
| customer_orders            | taxes                       | integer                  | YES         | 0                  |
| customer_orders            | discount                    | integer                  | YES         | 0                  |
| customer_orders            | promo_code                  | text                     | YES         | null               |
| customer_orders            | delivery_address            | jsonb                    | YES         | null               |
| customer_orders            | special_instructions        | text                     | YES         | null               |
| customer_orders            | cancelled_at                | timestamp with time zone | YES         | null               |
| customer_orders            | cancellation_reason         | text                     | YES         | null               |
| customer_orders            | delivered_at                | timestamp with time zone | YES         | null               |
| customer_profile_summary   | id                          | uuid                     | YES         | null               |
| customer_profile_summary   | full_name                   | text                     | YES         | null               |
| customer_profile_summary   | email                       | text                     | YES         | null               |
| customer_profile_summary   | phone                       | text                     | YES         | null               |
| customer_profile_summary   | avatar_url                  | text                     | YES         | null               |
| customer_profile_summary   | referral_code               | text                     | YES         | null               |
| customer_profile_summary   | total_orders                | integer                  | YES         | null               |
| customer_profile_summary   | total_spent                 | integer                  | YES         | null               |
| customer_profile_summary   | last_order_at               | timestamp with time zone | YES         | null               |
| customer_profile_summary   | member_since                | timestamp with time zone | YES         | null               |
| customer_profile_summary   | wallet_balance              | integer                  | YES         | null               |
| customer_profile_summary   | favorite_restaurants_count  | bigint                   | YES         | null               |
| customer_profile_summary   | favorite_dishes_count       | bigint                   | YES         | null               |
| customer_profile_summary   | saved_addresses_count       | bigint                   | YES         | null               |
| customer_wallet            | id                          | uuid                     | NO          | uuid_generate_v4() |
| customer_wallet            | customer_id                 | uuid                     | NO          | null               |
| customer_wallet            | balance                     | integer                  | YES         | 0                  |
| customer_wallet            | total_earned                | integer                  | YES         | 0                  |
| customer_wallet            | total_spent                 | integer                  | YES         | 0                  |
| customer_wallet            | created_at                  | timestamp with time zone | YES         | now()              |
| customer_wallet            | updated_at                  | timestamp with time zone | YES         | now()              |
| customers                  | id                          | uuid                     | NO          | null               |
| customers                  | full_name                   | text                     | NO          | null               |
| customers                  | phone                       | text                     | NO          | null               |
| customers                  | email                       | text                     | NO          | null               |
| customers                  | default_campus_id           | uuid                     | YES         | null               |
| customers                  | created_at                  | timestamp with time zone | YES         | now()              |
| customers                  | updated_at                  | timestamp with time zone | YES         | now()              |
| customers                  | hostel_block                | text                     | YES         | null               |
| customers                  | room_number                 | text                     | YES         | null               |
| customers                  | delivery_instructions       | text                     | YES         | null               |
| customers                  | avatar_url                  | text                     | YES         | null               |
| customers                  | referral_code               | text                     | YES         | null               |
| customers                  | referred_by                 | uuid                     | YES         | null               |
| customers                  | total_orders                | integer                  | YES         | 0                  |
| customers                  | total_spent                 | integer                  | YES         | 0                  |
| customers                  | last_order_at               | timestamp with time zone | YES         | null               |
| dishes                     | id                          | uuid                     | NO          | uuid_generate_v4() |
| dishes                     | restaurant_id               | uuid                     | NO          | null               |
| dishes                     | name                        | text                     | NO          | null               |
| dishes                     | description                 | text                     | YES         | null               |
| dishes                     | price                       | integer                  | NO          | null               |
| dishes                     | image                       | text                     | YES         | null               |
| dishes                     | veg                         | boolean                  | YES         | true               |
| dishes                     | rating                      | numeric                  | YES         | 0.0                |
| dishes                     | tags                        | ARRAY                    | YES         | null               |
| dishes                     | is_available                | boolean                  | YES         | true               |
| dishes                     | created_at                  | timestamp with time zone | YES         | now()              |
| dishes                     | updated_at                  | timestamp with time zone | YES         | now()              |
| favorite_dishes            | id                          | uuid                     | NO          | uuid_generate_v4() |
| favorite_dishes            | customer_id                 | uuid                     | NO          | null               |
| favorite_dishes            | dish_id                     | uuid                     | NO          | null               |
| favorite_dishes            | created_at                  | timestamp with time zone | YES         | now()              |
| favorite_restaurants       | id                          | uuid                     | NO          | uuid_generate_v4() |
| favorite_restaurants       | customer_id                 | uuid                     | NO          | null               |
| favorite_restaurants       | restaurant_id               | uuid                     | NO          | null               |
| favorite_restaurants       | created_at                  | timestamp with time zone | YES         | now()              |
| geography_columns          | f_table_catalog             | name                     | YES         | null               |
| geography_columns          | f_table_schema              | name                     | YES         | null               |
| geography_columns          | f_table_name                | name                     | YES         | null               |
| geography_columns          | f_geography_column          | name                     | YES         | null               |
| geography_columns          | coord_dimension             | integer                  | YES         | null               |
| geography_columns          | srid                        | integer                  | YES         | null               |
| geography_columns          | type                        | text                     | YES         | null               |
| geometry_columns           | f_table_catalog             | character varying        | YES         | null               |
| geometry_columns           | f_table_schema              | name                     | YES         | null               |
| geometry_columns           | f_table_name                | name                     | YES         | null               |
| geometry_columns           | f_geometry_column           | name                     | YES         | null               |
| geometry_columns           | coord_dimension             | integer                  | YES         | null               |
| geometry_columns           | srid                        | integer                  | YES         | null               |
| geometry_columns           | type                        | character varying        | YES         | null               |
| notifications              | id                          | uuid                     | NO          | uuid_generate_v4() |
| notifications              | customer_id                 | uuid                     | NO          | null               |
| notifications              | title                       | text                     | NO          | null               |
| notifications              | message                     | text                     | NO          | null               |
| notifications              | type                        | text                     | YES         | null               |
| notifications              | is_read                     | boolean                  | YES         | false              |
| notifications              | action_url                  | text                     | YES         | null               |
| notifications              | order_id                    | uuid                     | YES         | null               |
| notifications              | created_at                  | timestamp with time zone | YES         | now()              |
| order_details              | order_id                    | uuid                     | YES         | null               |
| order_details              | pool_id                     | uuid                     | YES         | null               |
| order_details              | pool_name                   | text                     | YES         | null               |
| order_details              | campus_id                   | uuid                     | YES         | null               |
| order_details              | campus_name                 | text                     | YES         | null               |
| order_details              | delivery_hotspot            | text                     | YES         | null               |
| order_details              | customer_id                 | uuid                     | YES         | null               |
| order_details              | customer_name               | text                     | YES         | null               |
| order_details              | customer_phone              | text                     | YES         | null               |
| order_details              | customer_email              | text                     | YES         | null               |
| order_details              | delivery_address            | jsonb                    | YES         | null               |
| order_details              | restaurant_id               | uuid                     | YES         | null               |
| order_details              | restaurant_name             | text                     | YES         | null               |
| order_details              | restaurant_address          | text                     | YES         | null               |
| order_details              | restaurant_lat              | numeric                  | YES         | null               |
| order_details              | restaurant_lng              | numeric                  | YES         | null               |
| order_details              | restaurant_phone            | text                     | YES         | null               |
| order_details              | items                       | jsonb                    | YES         | null               |
| order_details              | subtotal                    | integer                  | YES         | null               |
| order_details              | delivery_fee                | integer                  | YES         | null               |
| order_details              | platform_fee                | integer                  | YES         | null               |
| order_details              | taxes                       | integer                  | YES         | null               |
| order_details              | discount                    | integer                  | YES         | null               |
| order_details              | total                       | integer                  | YES         | null               |
| order_details              | promo_code                  | text                     | YES         | null               |
| order_details              | special_instructions        | text                     | YES         | null               |
| order_details              | payment_status              | text                     | YES         | null               |
| order_details              | payment_id                  | text                     | YES         | null               |
| order_details              | order_status                | text                     | YES         | null               |
| order_details              | synced_to_fleetbase         | boolean                  | YES         | null               |
| order_details              | cancelled_at                | timestamp with time zone | YES         | null               |
| order_details              | cancellation_reason         | text                     | YES         | null               |
| order_details              | delivered_at                | timestamp with time zone | YES         | null               |
| order_details              | delivery_window             | text                     | YES         | null               |
| order_details              | fleetbase_pool_id           | text                     | YES         | null               |
| order_details              | ordered_at                  | timestamp with time zone | YES         | null               |
| order_details              | updated_at                  | timestamp with time zone | YES         | null               |
| order_pools                | id                          | uuid                     | NO          | uuid_generate_v4() |
| order_pools                | name                        | text                     | NO          | null               |
| order_pools                | campus_id                   | uuid                     | NO          | null               |
| order_pools                | collection_start            | timestamp with time zone | NO          | null               |
| order_pools                | collection_end              | timestamp with time zone | NO          | null               |
| order_pools                | delivery_window             | text                     | NO          | null               |
| order_pools                | max_orders                  | integer                  | YES         | null               |
| order_pools                | delivery_fee_per_order      | integer                  | YES         | 0                  |
| order_pools                | manual_status               | text                     | YES         | 'open'::text       |
| order_pools                | fleetbase_pool_id           | text                     | YES         | null               |
| order_pools                | created_at                  | timestamp with time zone | YES         | now()              |
| order_pools                | updated_at                  | timestamp with time zone | YES         | now()              |
| order_pools                | description                 | text                     | YES         | null               |
| order_pools                | is_active                   | boolean                  | YES         | true               |
| order_pools                | participating_restaurants   | jsonb                    | YES         | '[]'::jsonb        |
| order_pools                | expected_delivery_time      | timestamp with time zone | YES         | null               |
| pool_restaurant_list       | pool_id                     | uuid                     | YES         | null               |
| pool_restaurant_list       | pool_name                   | text                     | YES         | null               |
| pool_restaurant_list       | campus_id                   | uuid                     | YES         | null               |
| pool_restaurant_list       | campus_name                 | text                     | YES         | null               |
| pool_restaurant_list       | pool_status                 | text                     | YES         | null               |
| pool_restaurant_list       | restaurant_id               | uuid                     | YES         | null               |
| pool_restaurant_list       | restaurant_name             | text                     | YES         | null               |
| pool_restaurant_list       | restaurant_active           | boolean                  | YES         | null               |
| pool_restaurant_list       | active_in_pool              | boolean                  | YES         | null               |
| pool_restaurant_list       | added_at                    | timestamp with time zone | YES         | null               |
| pool_restaurants           | id                          | uuid                     | NO          | uuid_generate_v4() |
| pool_restaurants           | pool_id                     | uuid                     | NO          | null               |
| pool_restaurants           | restaurant_id               | uuid                     | NO          | null               |
| pool_restaurants           | is_active                   | boolean                  | YES         | true               |
| pool_restaurants           | added_at                    | timestamp with time zone | YES         | now()              |
| pool_stats                 | pool_id                     | uuid                     | YES         | null               |
| pool_stats                 | name                        | text                     | YES         | null               |
| pool_stats                 | status                      | text                     | YES         | null               |
| pool_stats                 | campus_id                   | uuid                     | YES         | null               |
| pool_stats                 | campus_name                 | text                     | YES         | null               |
| pool_stats                 | hotspot_location            | text                     | YES         | null               |
| pool_stats                 | collection_start            | timestamp with time zone | YES         | null               |
| pool_stats                 | collection_end              | timestamp with time zone | YES         | null               |
| pool_stats                 | delivery_window             | text                     | YES         | null               |
| pool_stats                 | max_orders                  | integer                  | YES         | null               |
| pool_stats                 | delivery_fee_per_order      | integer                  | YES         | null               |
| pool_stats                 | current_order_count         | bigint                   | YES         | null               |
| pool_stats                 | unique_customers            | bigint                   | YES         | null               |
| pool_stats                 | total_revenue               | bigint                   | YES         | null               |
| pool_stats                 | is_accepting_orders         | boolean                  | YES         | null               |
| pool_stats                 | is_collection_window_open   | boolean                  | YES         | null               |
| pool_stats                 | is_active                   | boolean                  | YES         | null               |
| pool_stats                 | fleetbase_pool_id           | text                     | YES         | null               |
| pool_stats                 | created_at                  | timestamp with time zone | YES         | null               |
| pool_stats                 | updated_at                  | timestamp with time zone | YES         | null               |
| pools_with_computed_status | id                          | uuid                     | YES         | null               |
| pools_with_computed_status | name                        | text                     | YES         | null               |
| pools_with_computed_status | campus_id                   | uuid                     | YES         | null               |
| pools_with_computed_status | collection_start            | timestamp with time zone | YES         | null               |
| pools_with_computed_status | collection_end              | timestamp with time zone | YES         | null               |
| pools_with_computed_status | delivery_window             | text                     | YES         | null               |
| pools_with_computed_status | max_orders                  | integer                  | YES         | null               |
| pools_with_computed_status | delivery_fee_per_order      | integer                  | YES         | null               |
| pools_with_computed_status | manual_status               | text                     | YES         | null               |
| pools_with_computed_status | fleetbase_pool_id           | text                     | YES         | null               |
| pools_with_computed_status | created_at                  | timestamp with time zone | YES         | null               |
| pools_with_computed_status | updated_at                  | timestamp with time zone | YES         | null               |
| pools_with_computed_status | computed_status             | text                     | YES         | null               |
| promo_code_analytics       | promo_code_id               | uuid                     | YES         | null               |
| promo_code_analytics       | code                        | text                     | YES         | null               |
| promo_code_analytics       | code_type                   | text                     | YES         | null               |
| promo_code_analytics       | description                 | text                     | YES         | null               |
| promo_code_analytics       | discount_type               | text                     | YES         | null               |
| promo_code_analytics       | discount_value              | integer                  | YES         | null               |
| promo_code_analytics       | affiliate_id                | uuid                     | YES         | null               |
| promo_code_analytics       | affiliate_name              | text                     | YES         | null               |
| promo_code_analytics       | affiliate_commission_type   | text                     | YES         | null               |
| promo_code_analytics       | affiliate_commission_value  | integer                  | YES         | null               |
| promo_code_analytics       | is_active                   | boolean                  | YES         | null               |
| promo_code_analytics       | valid_from                  | timestamp with time zone | YES         | null               |
| promo_code_analytics       | valid_until                 | timestamp with time zone | YES         | null               |
| promo_code_analytics       | usage_limit                 | integer                  | YES         | null               |
| promo_code_analytics       | total_uses                  | bigint                   | YES         | null               |
| promo_code_analytics       | unique_customers            | bigint                   | YES         | null               |
| promo_code_analytics       | total_order_value           | bigint                   | YES         | null               |
| promo_code_analytics       | total_discount_given        | bigint                   | YES         | null               |
| promo_code_analytics       | total_commission_owed       | bigint                   | YES         | null               |
| promo_code_analytics       | avg_order_value             | numeric                  | YES         | null               |
| promo_code_analytics       | first_used_at               | timestamp with time zone | YES         | null               |
| promo_code_analytics       | last_used_at                | timestamp with time zone | YES         | null               |
| promo_code_usage           | id                          | uuid                     | NO          | uuid_generate_v4() |
| promo_code_usage           | promo_code_id               | uuid                     | NO          | null               |
| promo_code_usage           | customer_id                 | uuid                     | NO          | null               |
| promo_code_usage           | order_id                    | uuid                     | YES         | null               |
| promo_code_usage           | discount_amount             | integer                  | NO          | null               |
| promo_code_usage           | order_total                 | integer                  | YES         | null               |
| promo_code_usage           | affiliate_commission_earned | integer                  | YES         | 0                  |
| promo_code_usage           | used_at                     | timestamp with time zone | YES         | now()              |
| promo_codes                | id                          | uuid                     | NO          | uuid_generate_v4() |
| promo_codes                | code                        | text                     | NO          | null               |
| promo_codes                | description                 | text                     | YES         | null               |
| promo_codes                | code_type                   | text                     | YES         | 'platform'::text   |
| promo_codes                | discount_type               | text                     | NO          | null               |
| promo_codes                | discount_value              | integer                  | NO          | null               |
| promo_codes                | min_order_value             | integer                  | YES         | 0                  |
| promo_codes                | max_discount                | integer                  | YES         | null               |
| promo_codes                | usage_limit                 | integer                  | YES         | null               |
| promo_codes                | usage_count                 | integer                  | YES         | 0                  |
| promo_codes                | per_user_limit              | integer                  | YES         | 1                  |
| promo_codes                | valid_from                  | timestamp with time zone | YES         | now()              |
| promo_codes                | valid_until                 | timestamp with time zone | YES         | null               |
| promo_codes                | is_active                   | boolean                  | YES         | true               |
| promo_codes                | applicable_to               | text                     | YES         | null               |
| promo_codes                | restaurant_ids              | ARRAY                    | YES         | null               |
| promo_codes                | pool_ids                    | ARRAY                    | YES         | null               |
| promo_codes                | affiliate_id                | uuid                     | YES         | null               |
| promo_codes                | affiliate_name              | text                     | YES         | null               |
| promo_codes                | affiliate_commission_type   | text                     | YES         | null               |
| promo_codes                | affiliate_commission_value  | integer                  | YES         | 0                  |
| promo_codes                | created_by                  | uuid                     | YES         | null               |
| promo_codes                | created_at                  | timestamp with time zone | YES         | now()              |
| promo_codes                | updated_at                  | timestamp with time zone | YES         | now()              |
| referrals                  | id                          | uuid                     | NO          | uuid_generate_v4() |
| referrals                  | referrer_id                 | uuid                     | NO          | null               |
| referrals                  | referral_code               | text                     | NO          | null               |
| referrals                  | referee_id                  | uuid                     | YES         | null               |
| referrals                  | referrer_reward             | integer                  | YES         | 0                  |
| referrals                  | referee_reward              | integer                  | YES         | 0                  |
| referrals                  | status                      | text                     | YES         | 'pending'::text    |
| referrals                  | completed_at                | timestamp with time zone | YES         | null               |
| referrals                  | created_at                  | timestamp with time zone | YES         | now()              |
| refunds                    | id                          | uuid                     | NO          | uuid_generate_v4() |
| refunds                    | order_id                    | uuid                     | NO          | null               |
| refunds                    | customer_id                 | uuid                     | NO          | null               |
| refunds                    | amount                      | integer                  | NO          | null               |
| refunds                    | reason                      | text                     | NO          | null               |
| refunds                    | refund_type                 | text                     | YES         | null               |
| refunds                    | status                      | text                     | YES         | 'pending'::text    |
| refunds                    | processed_by                | uuid                     | YES         | null               |
| refunds                    | payment_gateway_refund_id   | text                     | YES         | null               |
| refunds                    | created_at                  | timestamp with time zone | YES         | now()              |
| refunds                    | processed_at                | timestamp with time zone | YES         | null               |
| restaurant_hours           | id                          | uuid                     | NO          | uuid_generate_v4() |
| restaurant_hours           | restaurant_id               | uuid                     | NO          | null               |
| restaurant_hours           | day_of_week                 | integer                  | NO          | null               |
| restaurant_hours           | open_time                   | time without time zone   | NO          | null               |
| restaurant_hours           | close_time                  | time without time zone   | NO          | null               |
| restaurant_hours           | is_closed                   | boolean                  | YES         | false              |
| restaurant_menu            | restaurant_id               | uuid                     | YES         | null               |
| restaurant_menu            | restaurant_name             | text                     | YES         | null               |
| restaurant_menu            | restaurant_active           | boolean                  | YES         | null               |
| restaurant_menu            | dish_id                     | uuid                     | YES         | null               |
| restaurant_menu            | dish_name                   | text                     | YES         | null               |
| restaurant_menu            | description                 | text                     | YES         | null               |
| restaurant_menu            | price                       | integer                  | YES         | null               |
| restaurant_menu            | image                       | text                     | YES         | null               |
| restaurant_menu            | veg                         | boolean                  | YES         | null               |
| restaurant_menu            | rating                      | numeric                  | YES         | null               |
| restaurant_menu            | tags                        | ARRAY                    | YES         | null               |
| restaurant_menu            | dish_available              | boolean                  | YES         | null               |
| restaurant_views           | id                          | uuid                     | NO          | uuid_generate_v4() |
| restaurant_views           | customer_id                 | uuid                     | NO          | null               |
| restaurant_views           | restaurant_id               | uuid                     | NO          | null               |
| restaurant_views           | viewed_at                   | timestamp with time zone | YES         | now()              |
| restaurants                | id                          | uuid                     | NO          | uuid_generate_v4() |
| restaurants                | name                        | text                     | NO          | null               |
| restaurants                | address                     | text                     | NO          | null               |
| restaurants                | latitude                    | numeric                  | NO          | null               |
| restaurants                | longitude                   | numeric                  | NO          | null               |
| restaurants                | phone                       | text                     | YES         | null               |
| restaurants                | email                       | text                     | YES         | null               |
| restaurants                | is_active                   | boolean                  | YES         | true               |
| restaurants                | created_at                  | timestamp with time zone | YES         | now()              |
| restaurants                | updated_at                  | timestamp with time zone | YES         | now()              |
| restaurants                | rating                      | numeric                  | YES         | 0.0                |
| restaurants                | delivery_time               | integer                  | YES         | 30                 |
| restaurants                | cost_for_two                | integer                  | YES         | 40000              |
| restaurants                | cuisine                     | ARRAY                    | YES         | '{}'::text[]       |
| restaurants                | image                       | text                     | YES         | null               |
| restaurants                | location                    | text                     | YES         | null               |
| reviews                    | id                          | uuid                     | NO          | uuid_generate_v4() |
| reviews                    | customer_id                 | uuid                     | NO          | null               |
| reviews                    | customer_name               | text                     | NO          | null               |
| reviews                    | customer_avatar             | text                     | YES         | null               |
| reviews                    | rating                      | integer                  | NO          | null               |
| reviews                    | comment                     | text                     | YES         | null               |
| reviews                    | target_id                   | uuid                     | NO          | null               |
| reviews                    | target_type                 | text                     | NO          | null               |
| reviews                    | created_at                  | timestamp with time zone | YES         | now()              |
| search_history             | id                          | uuid                     | NO          | uuid_generate_v4() |
| search_history             | customer_id                 | uuid                     | NO          | null               |
| search_history             | search_query                | text                     | NO          | null               |
| search_history             | results_count               | integer                  | YES         | 0                  |
| search_history             | searched_at                 | timestamp with time zone | YES         | now()              |
| spatial_ref_sys            | srid                        | integer                  | NO          | null               |
| spatial_ref_sys            | auth_name                   | character varying        | YES         | null               |
| spatial_ref_sys            | auth_srid                   | integer                  | YES         | null               |
| spatial_ref_sys            | srtext                      | character varying        | YES         | null               |
| spatial_ref_sys            | proj4text                   | character varying        | YES         | null               |
| support_messages           | id                          | uuid                     | NO          | uuid_generate_v4() |
| support_messages           | ticket_id                   | uuid                     | NO          | null               |
| support_messages           | sender_id                   | uuid                     | NO          | null               |
| support_messages           | sender_type                 | text                     | NO          | null               |
| support_messages           | message                     | text                     | NO          | null               |
| support_messages           | attachments                 | ARRAY                    | YES         | null               |
| support_messages           | created_at                  | timestamp with time zone | YES         | now()              |
| support_tickets            | id                          | uuid                     | NO          | uuid_generate_v4() |
| support_tickets            | customer_id                 | uuid                     | NO          | null               |
| support_tickets            | order_id                    | uuid                     | YES         | null               |
| support_tickets            | subject                     | text                     | NO          | null               |
| support_tickets            | description                 | text                     | NO          | null               |
| support_tickets            | category                    | text                     | YES         | null               |
| support_tickets            | status                      | text                     | YES         | 'open'::text       |
| support_tickets            | priority                    | text                     | YES         | 'medium'::text     |
| support_tickets            | assigned_to                 | uuid                     | YES         | null               |
| support_tickets            | resolution_notes            | text                     | YES         | null               |
| support_tickets            | created_at                  | timestamp with time zone | YES         | now()              |
| support_tickets            | updated_at                  | timestamp with time zone | YES         | now()              |
| support_tickets            | resolved_at                 | timestamp with time zone | YES         | null               |
| wallet_transactions        | id                          | uuid                     | NO          | uuid_generate_v4() |
| wallet_transactions        | wallet_id                   | uuid                     | NO          | null               |
| wallet_transactions        | transaction_type            | text                     | NO          | null               |
| wallet_transactions        | amount                      | integer                  | NO          | null               |
| wallet_transactions        | source                      | text                     | YES         | null               |
| wallet_transactions        | description                 | text                     | YES         | null               |
| wallet_transactions        | order_id                    | uuid                     | YES         | null               |
| wallet_transactions        | balance_after               | integer                  | NO          | null               |
| wallet_transactions        | created_at                  | timestamp with time zone | YES         | now()              |




## the views are
| table_name                 | view_definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| geometry_columns           | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| geography_columns          | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| pool_stats                 |  SELECT p.id AS pool_id,
    p.name,
    p.manual_status AS status,
    p.campus_id,
    c.name AS campus_name,
    c.hotspot_location,
    p.collection_start,
    p.collection_end,
    p.delivery_window,
    p.max_orders,
    p.delivery_fee_per_order,
    count(DISTINCT o.id) AS current_order_count,
    count(DISTINCT o.customer_id) AS unique_customers,
    sum(o.total) AS total_revenue,
    ((p.max_orders IS NULL) OR (count(DISTINCT o.id) < p.max_orders)) AS is_accepting_orders,
    ((now() >= p.collection_start) AND (now() <= p.collection_end)) AS is_collection_window_open,
    p.is_active,
    p.fleetbase_pool_id,
    p.created_at,
    p.updated_at
   FROM ((order_pools p
     LEFT JOIN campuses c ON ((c.id = p.campus_id)))
     LEFT JOIN customer_orders o ON ((o.pool_id = p.id)))
  GROUP BY p.id, p.name, p.manual_status, p.campus_id, c.name, c.hotspot_location, p.collection_start, p.collection_end, p.delivery_window, p.max_orders, p.delivery_fee_per_order, p.is_active, p.fleetbase_pool_id, p.created_at, p.updated_at;                                                                                                                       |
| order_details              |  SELECT o.id AS order_id,
    o.pool_id,
    p.name AS pool_name,
    p.campus_id,
    c.name AS campus_name,
    c.hotspot_location AS delivery_hotspot,
    o.customer_id,
    cust.full_name AS customer_name,
    cust.phone AS customer_phone,
    cust.email AS customer_email,
    o.delivery_address,
    o.restaurant_id,
    r.name AS restaurant_name,
    r.address AS restaurant_address,
    r.latitude AS restaurant_lat,
    r.longitude AS restaurant_lng,
    r.phone AS restaurant_phone,
    o.items,
    o.subtotal,
    o.delivery_fee,
    o.platform_fee,
    o.taxes,
    o.discount,
    o.total,
    o.promo_code,
    o.special_instructions,
    o.payment_status,
    o.payment_id,
    o.status AS order_status,
    o.synced_to_fleetbase,
    o.cancelled_at,
    o.cancellation_reason,
    o.delivered_at,
    p.delivery_window,
    p.fleetbase_pool_id,
    o.created_at AS ordered_at,
    o.updated_at
   FROM ((((customer_orders o
     JOIN order_pools p ON ((p.id = o.pool_id)))
     JOIN campuses c ON ((c.id = p.campus_id)))
     JOIN customers cust ON ((cust.id = o.customer_id)))
     LEFT JOIN restaurants r ON ((r.id = o.restaurant_id))); |
| restaurant_menu            |  SELECT r.id AS restaurant_id,
    r.name AS restaurant_name,
    r.is_active AS restaurant_active,
    d.id AS dish_id,
    d.name AS dish_name,
    d.description,
    d.price,
    d.image,
    d.veg,
    d.rating,
    d.tags,
    d.is_available AS dish_available
   FROM (restaurants r
     LEFT JOIN dishes d ON ((d.restaurant_id = r.id)))
  WHERE (r.is_active = true)
  ORDER BY r.name, d.name;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| pool_restaurant_list       |  SELECT p.id AS pool_id,
    p.name AS pool_name,
    p.campus_id,
    c.name AS campus_name,
    p.manual_status AS pool_status,
    pr.restaurant_id,
    r.name AS restaurant_name,
    r.is_active AS restaurant_active,
    pr.is_active AS active_in_pool,
    pr.added_at
   FROM (((order_pools p
     JOIN campuses c ON ((c.id = p.campus_id)))
     JOIN pool_restaurants pr ON ((pr.pool_id = p.id)))
     JOIN restaurants r ON ((r.id = pr.restaurant_id)))
  WHERE (pr.is_active = true)
  ORDER BY p.name, r.name;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| customer_order_history     |  SELECT o.customer_id,
    o.id AS order_id,
    o.pool_id,
    p.name AS pool_name,
    o.restaurant_id,
    r.name AS restaurant_name,
    r.image AS restaurant_image,
    o.items,
    o.total,
    o.status,
    o.payment_status,
    o.created_at AS ordered_at,
    o.delivered_at,
    ( SELECT count(*) AS count
           FROM jsonb_array_elements(o.items) jsonb_array_elements(value)) AS item_count
   FROM ((customer_orders o
     JOIN order_pools p ON ((p.id = o.pool_id)))
     LEFT JOIN restaurants r ON ((r.id = o.restaurant_id)))
  ORDER BY o.created_at DESC;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| cart_summary               |  SELECT c.id AS cart_id,
    c.customer_id,
    c.pool_id,
    p.name AS pool_name,
    p.campus_id,
    count(DISTINCT ci.restaurant_id) AS restaurant_count,
    count(ci.id) AS item_count,
    sum(ci.quantity) AS total_quantity,
    sum((ci.price * ci.quantity)) AS cart_subtotal,
    p.delivery_fee_per_order,
    c.created_at,
    c.updated_at
   FROM ((cart c
     JOIN order_pools p ON ((p.id = c.pool_id)))
     LEFT JOIN cart_items ci ON ((ci.cart_id = c.id)))
  GROUP BY c.id, c.customer_id, c.pool_id, p.name, p.campus_id, p.delivery_fee_per_order, c.created_at, c.updated_at;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| customer_profile_summary   |  SELECT c.id,
    c.full_name,
    c.email,
    c.phone,
    c.avatar_url,
    c.referral_code,
    c.total_orders,
    c.total_spent,
    c.last_order_at,
    c.created_at AS member_since,
    COALESCE(w.balance, 0) AS wallet_balance,
    count(DISTINCT fa.id) AS favorite_restaurants_count,
    count(DISTINCT fd.id) AS favorite_dishes_count,
    count(DISTINCT ca.id) AS saved_addresses_count
   FROM ((((customers c
     LEFT JOIN customer_wallet w ON ((w.customer_id = c.id)))
     LEFT JOIN favorite_restaurants fa ON ((fa.customer_id = c.id)))
     LEFT JOIN favorite_dishes fd ON ((fd.customer_id = c.id)))
     LEFT JOIN customer_addresses ca ON ((ca.customer_id = c.id)))
  GROUP BY c.id, c.full_name, c.email, c.phone, c.avatar_url, c.referral_code, c.total_orders, c.total_spent, c.last_order_at, c.created_at, w.balance;                                                                                                                                                                                                                                                                                                                                   |
| promo_code_analytics       |  SELECT pc.id AS promo_code_id,
    pc.code,
    pc.code_type,
    pc.description,
    pc.discount_type,
    pc.discount_value,
    pc.affiliate_id,
    pc.affiliate_name,
    pc.affiliate_commission_type,
    pc.affiliate_commission_value,
    pc.is_active,
    pc.valid_from,
    pc.valid_until,
    pc.usage_limit,
    count(pcu.id) AS total_uses,
    count(DISTINCT pcu.customer_id) AS unique_customers,
    sum(pcu.order_total) AS total_order_value,
    sum(pcu.discount_amount) AS total_discount_given,
    sum(pcu.affiliate_commission_earned) AS total_commission_owed,
    avg(pcu.order_total) AS avg_order_value,
    min(pcu.used_at) AS first_used_at,
    max(pcu.used_at) AS last_used_at
   FROM (promo_codes pc
     LEFT JOIN promo_code_usage pcu ON ((pcu.promo_code_id = pc.id)))
  GROUP BY pc.id, pc.code, pc.code_type, pc.description, pc.discount_type, pc.discount_value, pc.affiliate_id, pc.affiliate_name, pc.affiliate_commission_type, pc.affiliate_commission_value, pc.is_active, pc.valid_from, pc.valid_until, pc.usage_limit;                                                                                                                  |
| affiliate_dashboard        |  SELECT pc.affiliate_id,
    pc.affiliate_name,
    pc.code AS affiliate_code,
    count(DISTINCT pcu.customer_id) AS customers_referred,
    count(DISTINCT pcu.order_id) AS total_orders,
    sum(pcu.order_total) AS total_order_value,
    sum(pcu.discount_amount) AS total_discount_given,
    sum(pcu.affiliate_commission_earned) AS total_commission_earned,
    avg(pcu.order_total) AS avg_order_value,
    pc.created_at AS partnership_started,
    max(pcu.used_at) AS last_order_at
   FROM (promo_codes pc
     JOIN promo_code_usage pcu ON ((pcu.promo_code_id = pc.id)))
  WHERE (pc.code_type = 'affiliate'::text)
  GROUP BY pc.affiliate_id, pc.affiliate_name, pc.code, pc.created_at
  ORDER BY (sum(pcu.affiliate_commission_earned)) DESC;                                                                                                                                                                                                                                                                                                                                                                                                                                |
| pools_with_computed_status |  SELECT id,
    name,
    campus_id,
    collection_start,
    collection_end,
    delivery_window,
    max_orders,
    delivery_fee_per_order,
    manual_status,
    fleetbase_pool_id,
    created_at,
    updated_at,
        CASE
            WHEN (manual_status = 'closed'::text) THEN 'closed'::text
            WHEN (manual_status = 'synced'::text) THEN 'synced'::text
            WHEN (collection_end < CURRENT_TIMESTAMP) THEN 'closed'::text
            WHEN (collection_start > CURRENT_TIMESTAMP) THEN 'scheduled'::text
            ELSE 'open'::text
        END AS computed_status
   FROM order_pools;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |