
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text,
  phone text DEFAULT '',
  address text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''), NEW.email, COALESCE(NEW.raw_user_meta_data->>'phone',''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text DEFAULT '',
  image_url text,
  subcategories text[] NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.car_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.car_brands TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.car_brands TO authenticated;
GRANT ALL ON public.car_brands TO service_role;
ALTER TABLE public.car_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read brands" ON public.car_brands FOR SELECT USING (true);
CREATE POLICY "Admin manage brands" ON public.car_brands FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.car_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.car_brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(brand_id, name)
);
GRANT SELECT ON public.car_models TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.car_models TO authenticated;
GRANT ALL ON public.car_models TO service_role;
ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read models" ON public.car_models FOR SELECT USING (true);
CREATE POLICY "Admin manage models" ON public.car_models FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category_slug text NOT NULL REFERENCES public.categories(slug) ON UPDATE CASCADE,
  subcategory text DEFAULT '',
  brand text DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  images text[] NOT NULL DEFAULT '{}',
  compatible_brands text[] NOT NULL DEFAULT '{}',
  compatible_models text[] NOT NULL DEFAULT '{}',
  stock_status text NOT NULL DEFAULT 'in_stock',
  rating numeric(2,1) NOT NULL DEFAULT 4.5,
  specifications jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT '',
  car text DEFAULT '',
  rating int NOT NULL DEFAULT 5,
  review text NOT NULL DEFAULT '',
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read approved reviews" ON public.reviews FOR SELECT USING (approved OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users add reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND approved = false);
CREATE POLICY "Admin update reviews" ON public.reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete reviews" ON public.reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  total numeric(12,2) NOT NULL DEFAULT 0,
  whatsapp_status text NOT NULL DEFAULT 'sent_to_whatsapp',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own orders read" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Own orders insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text DEFAULT '',
  car_brand text DEFAULT '',
  car_model text DEFAULT '',
  looking_for text DEFAULT '',
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.consultations TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.consultations TO authenticated;
GRANT ALL ON public.consultations TO service_role;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request consultation" ON public.consultations FOR INSERT TO anon, authenticated WITH CHECK (length(name) BETWEEN 1 AND 100 AND length(phone) BETWEEN 5 AND 20);
CREATE POLICY "Admin read consultations" ON public.consultations FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update consultations" ON public.consultations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete consultations" ON public.consultations FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  company_name text NOT NULL DEFAULT 'Autoluxe',
  about text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  whatsapp_number text DEFAULT '',
  address text DEFAULT '',
  office_hours text DEFAULT '',
  map_query text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin update settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.site_settings (company_name, about, phone, email, whatsapp_number, address, office_hours, map_query) VALUES
('Autoluxe', 'Autoluxe is a premium car accessories studio offering genuine, perfectly fitted interior, exterior, lighting, electronics and performance upgrades for every major car brand.', '+91 98765 43210', 'hello@autoluxe.in', '919876543210', '12 Auto Plaza, MG Road, Bengaluru 560001', 'Mon – Sat: 10:00 AM – 8:00 PM · Sun: 11:00 AM – 5:00 PM', 'MG Road Bengaluru');

INSERT INTO public.categories (slug, name, description, subcategories, sort_order) VALUES
('interior','Interior Accessories','Seat covers, mats, lighting and comfort upgrades for your cabin.', ARRAY['Seat Covers','Floor Mats','Dashboard Accessories','Steering Covers','Interior Lighting','Organizers','Car Perfumes','Sun Shades'],1),
('exterior','Exterior Accessories','Body covers, spoilers, chrome and styling for a bold stance.', ARRAY['Car Body Covers','Spoilers','Mud Flaps','Side Steps','Chrome Accessories','Number Plate Frames','Roof Accessories','Exterior Lighting'],2),
('electronics','Car Electronics','Dash cams, chargers, sensors and smart gadgets.', ARRAY['Dash Cams','Chargers','Parking Sensors','Tyre Inflators'],3),
('audio','Audio & Infotainment','Touchscreen stereos, speakers, amplifiers and subwoofers.', ARRAY['Stereos','Speakers','Amplifiers','Subwoofers'],4),
('safety','Safety Accessories','Tyre pressure monitors, first-aid, fire safety and more.', ARRAY['TPMS','Emergency Kits','Child Safety'],5),
('lighting','Lighting','LED headlights, fog lamps and ambient lighting kits.', ARRAY['Headlights','Fog Lamps','Ambient Lighting'],6),
('car-care','Car Care','Ceramic coats, shampoos, polishers and detailing kits.', ARRAY['Shampoo','Polish & Wax','Detailing Kits'],7),
('performance','Performance','Air filters, exhausts and tuning accessories.', ARRAY['Air Filters','Exhaust Tips','Pedals'],8),
('utility','Utility Accessories','Roof boxes, trunk organizers and practical add-ons.', ARRAY['Trunk Organizers','Roof Boxes','Holders'],9);

WITH b AS (
  INSERT INTO public.car_brands (name) VALUES ('Hyundai'),('Maruti Suzuki'),('Tata'),('Mahindra'),('Kia'),('Toyota'),('Honda'),('BMW'),('Mercedes-Benz') RETURNING id, name
)
INSERT INTO public.car_models (brand_id, name)
SELECT b.id, m.name FROM b JOIN (VALUES
 ('Hyundai','Creta'),('Hyundai','Venue'),('Hyundai','i20'),('Hyundai','Verna'),
 ('Maruti Suzuki','Swift'),('Maruti Suzuki','Baleno'),('Maruti Suzuki','Brezza'),('Maruti Suzuki','Dzire'),
 ('Tata','Nexon'),('Tata','Harrier'),('Tata','Punch'),
 ('Mahindra','XUV700'),('Mahindra','Thar'),('Mahindra','Scorpio-N'),
 ('Kia','Seltos'),('Kia','Sonet'),
 ('Toyota','Fortuner'),('Toyota','Innova Crysta'),
 ('Honda','City'),('Honda','Amaze'),
 ('BMW','3 Series'),('BMW','X1'),
 ('Mercedes-Benz','C-Class'),('Mercedes-Benz','GLA')
) AS m(brand, name) ON m.brand = b.name;

INSERT INTO public.products (name, description, category_slug, subcategory, brand, price, compatible_brands, compatible_models, stock_status, rating, specifications) VALUES
('Nappa Leather Seat Covers – Black/Red','Custom-fit premium nappa leatherette seat covers with contrast red stitching and airbag-safe seams.','interior','Seat Covers','AutoForm',8999,ARRAY['Hyundai','Kia'],ARRAY['Creta','Seltos','Venue','Sonet'],'in_stock',4.8,'{"Material":"Nappa leatherette","Seats":"5-seater full set","Warranty":"1 year"}'),
('7D Luxury Floor Mats','Full-coverage 7D mats with anti-skid base and waterproof diamond quilting.','interior','Floor Mats','Elegant',4499,ARRAY['Hyundai','Tata','Maruti Suzuki'],ARRAY['Creta','Nexon','Brezza','Harrier'],'in_stock',4.7,'{"Layers":"7D","Colour":"Black/Beige","Pieces":"3"}'),
('Universal Floor Mats – Rubber','Heavy-duty trim-to-fit rubber mats for all-weather protection.','interior','Floor Mats','3M',1499,'{}','{}','in_stock',4.3,'{"Material":"Rubber","Fit":"Universal"}'),
('Alcantara Steering Wheel Cover','Suede-feel steering cover with perforated grip zones and red centre marker.','interior','Steering Covers','Sparco',1299,'{}','{}','in_stock',4.6,'{"Diameter":"37–38 cm","Material":"Alcantara-feel suede"}'),
('RGB Ambient Interior Lighting Kit','64-colour app-controlled ambient footwell and dashboard strips with music sync.','interior','Interior Lighting','Osram',3299,'{}','{}','in_stock',4.5,'{"Colours":"64","Control":"Bluetooth app","Power":"12V / USB"}'),
('Creta Ambient Lighting – OEM Fit','Plug-and-play ambient door and dash lighting designed specifically for Hyundai Creta.','interior','Interior Lighting','Autoluxe',5499,ARRAY['Hyundai'],ARRAY['Creta'],'in_stock',4.9,'{"Fit":"OEM plug-and-play","Zones":"Doors + dashboard","Colours":"64"}'),
('Back Seat Organizer with Tablet Holder','Multi-pocket leatherette organizer with a 10" tablet sleeve.','interior','Organizers','Elegant',999,'{}','{}','in_stock',4.4,'{"Pockets":"8","Tablet":"Up to 10 in"}'),
('Premium Gel Car Perfume – Ocean','Long-lasting dashboard gel perfume, 60-day fragrance.','interior','Car Perfumes','Ambi Pur',449,'{}','{}','in_stock',4.2,'{"Volume":"70 g","Duration":"60 days"}'),
('Magnetic Window Sun Shades (Set of 4)','Custom-fit magnetic sunshades with UV-cut mesh.','interior','Sun Shades','Autoluxe',1799,ARRAY['Maruti Suzuki','Hyundai','Honda'],ARRAY['Swift','Baleno','i20','City'],'in_stock',4.5,'{"Pieces":"4","UV block":"Up to 80%"}'),
('Waterproof Car Body Cover – Triple Stitched','UV-resistant, dust-proof body cover with mirror pockets.','exterior','Car Body Covers','Autoluxe',2499,ARRAY['Hyundai','Kia','Tata'],ARRAY['Creta','Seltos','Nexon'],'in_stock',4.4,'{"Material":"Silver matty","Waterproof":"Yes"}'),
('Rear Roof Spoiler – Gloss Black','ABS rear spoiler with factory-matched mounting.','exterior','Spoilers','Autoluxe',3999,ARRAY['Maruti Suzuki'],ARRAY['Swift','Baleno'],'low_stock',4.6,'{"Material":"ABS","Finish":"Gloss black"}'),
('Mud Flaps (Set of 4)','OEM-style mud flaps protecting paint from stones and slush.','exterior','Mud Flaps','Autoluxe',699,ARRAY['Tata','Mahindra'],ARRAY['Nexon','Punch','XUV700'],'in_stock',4.3,'{"Pieces":"4"}'),
('Aluminium Side Steps','Rugged anodised aluminium side steps for SUVs.','exterior','Side Steps','Autoluxe',11999,ARRAY['Toyota','Mahindra'],ARRAY['Fortuner','Scorpio-N','XUV700'],'in_stock',4.7,'{"Material":"Aluminium","Load":"150 kg"}'),
('Chrome Door Handle Covers','Premium chrome door handle garnish, 3M taped.','exterior','Chrome Accessories','Autoluxe',899,ARRAY['Honda','Maruti Suzuki'],ARRAY['City','Dzire','Amaze'],'in_stock',4.1,'{"Pieces":"4"}'),
('Carbon Fibre Number Plate Frame','Real carbon-look frame with stainless screws.','exterior','Number Plate Frames','Autoluxe',799,'{}','{}','in_stock',4.3,'{"Pieces":"2"}'),
('Roof Rails – Silver','Bolt-on roof rails rated for roof boxes and carriers.','exterior','Roof Accessories','Autoluxe',6499,ARRAY['Hyundai','Kia','Maruti Suzuki'],ARRAY['Creta','Seltos','Brezza'],'in_stock',4.5,'{"Load":"60 kg","Material":"Aluminium"}'),
('4K Front & Rear Dash Cam','4K front + 1080p rear camera with night vision, GPS and parking mode.','electronics','Dash Cams','70mai',9999,'{}','{}','in_stock',4.8,'{"Resolution":"4K + 1080p","Storage":"Up to 256 GB","GPS":"Built-in"}'),
('65W Dual USB-C Fast Car Charger','PD 65W dual-port charger that powers laptops and phones.','electronics','Chargers','Anker',1799,'{}','{}','in_stock',4.6,'{"Output":"65W","Ports":"2 × USB-C"}'),
('Digital Tyre Inflator','Cordless digital inflator with auto-stop and LED torch.','electronics','Tyre Inflators','Michelin',3499,'{}','{}','in_stock',4.5,'{"Max pressure":"150 PSI","Battery":"Cordless"}'),
('9" Android Touchscreen Stereo','Wireless Apple CarPlay & Android Auto, 4GB RAM, rear camera input.','audio','Stereos','Pioneer',18999,ARRAY['Hyundai','Maruti Suzuki','Tata'],ARRAY['Creta','Swift','Nexon','Baleno'],'in_stock',4.7,'{"Screen":"9 in IPS","RAM":"4 GB","CarPlay":"Wireless"}'),
('6.5" 3-Way Coaxial Speakers','High-fidelity coaxial speakers, 300W peak.','audio','Speakers','JBL',4999,'{}','{}','in_stock',4.6,'{"Size":"6.5 in","Peak":"300W"}'),
('Compact Active Underseat Subwoofer','Slim powered subwoofer that fits under the seat.','audio','Subwoofers','Sony',12499,'{}','{}','low_stock',4.5,'{"Power":"160W RMS"}'),
('Solar Tyre Pressure Monitor (TPMS)','Real-time pressure and temperature for all 4 tyres with solar display.','safety','TPMS','Steelmate',3999,'{}','{}','in_stock',4.6,'{"Sensors":"4 external","Power":"Solar + USB"}'),
('Car Emergency Kit','First-aid, reflective triangle, tow rope and jumper cables.','safety','Emergency Kits','Autoluxe',1999,'{}','{}','in_stock',4.4,'{"Items":"25+"}'),
('LED Projector Headlight Bulbs H4','6500K 120W LED bulbs with CANbus, 300% brighter.','lighting','Headlights','Philips',3499,ARRAY['Maruti Suzuki','Hyundai','Honda'],ARRAY['Swift','Dzire','i20','Amaze'],'in_stock',4.7,'{"Colour temp":"6500K","Socket":"H4"}'),
('LED Fog Lamp Kit with DRL','Bi-colour fog lamps with daytime running rings.','lighting','Fog Lamps','Osram',4299,ARRAY['Mahindra','Tata'],ARRAY['Thar','Nexon','Harrier'],'in_stock',4.5,'{"Modes":"White / Yellow"}'),
('Ceramic Coating Kit 9H','DIY 9H ceramic coating with 2-year protection.','car-care','Polish & Wax','Meguiar''s',2999,'{}','{}','in_stock',4.6,'{"Hardness":"9H","Protection":"Up to 2 years"}'),
('Complete Car Detailing Kit','Shampoo, wax, microfibers, tyre shine and dashboard cleaner.','car-care','Detailing Kits','3M',1999,'{}','{}','in_stock',4.5,'{"Items":"9"}'),
('High-Flow Performance Air Filter','Washable reusable cotton air filter for better throttle response.','performance','Air Filters','K&N',4499,ARRAY['Hyundai','Kia'],ARRAY['Creta','Seltos','Verna'],'in_stock',4.7,'{"Type":"Drop-in washable","Warranty":"Lifetime"}'),
('Stainless Steel Exhaust Tip','Dual-wall polished stainless exhaust tip.','performance','Exhaust Tips','Autoluxe',1499,'{}','{}','in_stock',4.2,'{"Inlet":"2.5 in"}'),
('Collapsible Trunk Organizer','Foldable multi-compartment boot organizer with lid.','utility','Trunk Organizers','Autoluxe',1299,'{}','{}','in_stock',4.4,'{"Capacity":"55 L"}'),
('Magnetic Phone Mount (MagSafe)','Dash/vent magnetic mount with 360° rotation.','utility','Holders','Spigen',1199,'{}','{}','in_stock',4.5,'{"Rotation":"360°"}');

INSERT INTO public.reviews (author_name, car, rating, review, approved) VALUES
('Rahul Mehta','Hyundai Creta',5,'The Creta ambient lighting kit looks factory-fitted. Ordering on WhatsApp was quick and they helped with installation.',true),
('Priya Nair','Kia Seltos',5,'Seat covers fit perfectly — genuinely premium feel. CONNECT suggested exactly the right set for my car.',true),
('Arjun Singh','Mahindra Thar',4,'Fog lamps are super bright and the team walked me through compatibility before I ordered.',true),
('Sneha Kapoor','Maruti Baleno',5,'Great prices and fast response on WhatsApp. The 7D mats are excellent.',true);
