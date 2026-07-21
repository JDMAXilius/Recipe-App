# Otto — Serving sizes (snapshot before the 1-serving default)

Generated 2026-07-21, immediately BEFORE changing the app to open every recipe
at 1 serving by default. This file preserves the serving data as it stood, so
nothing is lost and any recipe can be restored or audited later.

**What changes with the new default:** only the DISPLAY — the serving stepper now
opens at 1 and the ingredient amounts scale down accordingly. The values below
remain the recipes' true yields: nutrition per-serving is still computed against
them (`backend/src/lib/nutrition/recipeFacts.json`), and they are NOT modified.

**Pre-change defaults being replaced:**

| Surface | Was | Now |
|---|---|---|
| Recipe detail opens at (`app/recipe/[id].jsx` BASE_SERVINGS) | 4 (user recipes: their own value) | 1 |
| Cook mode fallback (`app/recipe/cook/[id].jsx`) | 4 | 1 |
| Recipe editor default for a new recipe (`app/recipe/edit.jsx`) | 4 | 1 |

**Seed recipes with curated serving counts: 758** (source: recipeFacts.json,
judged from each recipe's own ingredients and instructions). Seed recipes absent
from this list (0 in the cached corpus) had no curated count and used the
flat default of 4. User recipes carry their own `servings` column in the database
(per-user; not exportable from this environment) — this change does not touch it.

| Recipe ID | Title | Category | Servings |
|---|---|---|--:|
| 52764 | Garides Saganaki | Seafood | 4 |
| 52765 | Chicken Enchilada Casserole | Chicken | 4 |
| 52767 | Bakewell tart | Dessert | 8 |
| 52768 | Apple Frangipan Tart | Dessert | 8 |
| 52769 | Kapsalon | Lamb | 2 |
| 52770 | Spaghetti Bolognese | Beef | 4 |
| 52771 | Spicy Arrabiata Penne | Vegetarian | 4 |
| 52772 | Teriyaki Chicken Casserole | Chicken | 6 |
| 52773 | Honey Teriyaki Salmon | Seafood | 4 |
| 52774 | Pad See Ew | Chicken | 2 |
| 52775 | Vegan Lasagna | Vegan | 4 |
| 52776 | Chocolate Gateau | Dessert | 10 |
| 52777 | Mediterranean Pasta Salad | Seafood | 4 |
| 52779 | Cream Cheese Tart | Starter | 6 |
| 52780 | Potato Gratin with Chicken | Chicken | 4 |
| 52781 | Irish stew | Beef | 8 |
| 52782 | Lamb tomato and sweet spices | Lamb | 4 |
| 52783 | Rigatoni with fennel sausage sauce | Lamb | 6 |
| 52784 | Smoky Lentil Chili with Squash | Vegetarian | 6 |
| 52785 | Dal fry | Vegetarian | 4 |
| 52786 | Rocky Road Fudge | Dessert | 24 |
| 52787 | Hot Chocolate Fudge | Dessert | 24 |
| 52788 | Christmas Pudding Flapjack | Dessert | 12 |
| 52791 | Eton Mess | Dessert | 4 |
| 52792 | Bread and Butter Pudding | Dessert | 4 |
| 52793 | Sticky Toffee Pudding Ultimate | Dessert | 7 |
| 52794 | Vegan Chocolate Cake | Vegan | 8 |
| 52795 | Chicken Handi | Chicken | 6 |
| 52796 | Chicken Alfredo Primavera | Chicken | 6 |
| 52797 | Spicy North African Potato Salad | Vegetarian | 4 |
| 52802 | Fish pie | Seafood | 6 |
| 52803 | Beef Wellington | Beef | 4 |
| 52804 | Poutine | Miscellaneous | 4 |
| 52805 | Lamb Biryani | Lamb | 4 |
| 52806 | Tandoori chicken | Chicken | 8 |
| 52807 | Baingan Bharta | Vegetarian | 3 |
| 52808 | Lamb Rogan josh | Lamb | 6 |
| 52809 | Recheado Masala Fish | Seafood | 4 |
| 52810 | Osso Buco alla Milanese | Miscellaneous | 4 |
| 52811 | Ribollita | Vegetarian | 4 |
| 52812 | Beef Brisket Pot Roast | Beef | 8 |
| 52813 | Kentucky Fried Chicken | Chicken | 4 |
| 52814 | Thai Green Curry | Chicken | 4 |
| 52815 | French Lentils With Garlic and Thyme | Miscellaneous | 6 |
| 52816 | Roasted Eggplant With Tahini, Pine Nuts, and Lentils | Vegetarian | 4 |
| 52817 | Stovetop Eggplant With Harissa, Chickpeas, and Cumin Yogurt | Vegetarian | 4 |
| 52818 | Chicken Fajita Mac and Cheese | Chicken | 4 |
| 52819 | Cajun spiced fish tacos | Seafood | 4 |
| 52820 | Katsu Chicken curry | Chicken | 4 |
| 52821 | Laksa King Prawn Noodles | Seafood | 2 |
| 52822 | Toad In The Hole | Pork | 4 |
| 52823 | Salmon Prawn Risotto | Seafood | 2 |
| 52824 | Beef Sunday Roast | Beef | 4 |
| 52826 | Braised Beef Chilli | Beef | 8 |
| 52827 | Massaman Beef curry | Beef | 4 |
| 52828 | Vietnamese Grilled Pork (bun-thit-nuong) | Pork | 4 |
| 52829 | Grilled Mac and Cheese Sandwich | Pasta | 8 |
| 52830 | Crock Pot Chicken Baked Tacos | Chicken | 6 |
| 52831 | Chicken Karaage | Chicken | 4 |
| 52832 | Coq au vin | Chicken | 6 |
| 52833 | Salted Caramel Cheescake | Dessert | 12 |
| 52834 | Beef stroganoff | Beef | 4 |
| 52835 | Fettucine alfredo | Pasta | 2 |
| 52836 | Seafood fideuà | Seafood | 6 |
| 52837 | Pilchard puttanesca | Pasta | 4 |
| 52838 | Venetian Duck Ragu | Pasta | 6 |
| 52839 | Chilli prawn linguine | Pasta | 4 |
| 52840 | Clam chowder | Starter | 4 |
| 52841 | Creamy Tomato Soup | Starter | 8 |
| 52842 | Broccoli & Stilton soup | Starter | 4 |
| 52843 | Lamb Tagine | Lamb | 4 |
| 52844 | Lasagne | Pasta | 6 |
| 52845 | Turkey Meatloaf | Miscellaneous | 4 |
| 52846 | Chicken & mushroom Hotpot | Chicken | 4 |
| 52847 | Pork Cassoulet | Pork | 4 |
| 52848 | Bean & Sausage Hotpot | Miscellaneous | 4 |
| 52849 | Spinach & Ricotta Cannelloni | Vegetarian | 10 |
| 52850 | Chicken Couscous | Chicken | 2 |
| 52851 | Nutty Chicken Curry | Chicken | 4 |
| 52852 | Tuna Nicoise | Seafood | 4 |
| 52853 | Chocolate Avocado Mousse | Dessert | 4 |
| 52854 | Pancakes | Dessert | 4 |
| 52855 | Banana Pancakes | Dessert | 2 |
| 52856 | Choc Chip Pecan Pie | Dessert | 12 |
| 52857 | Pumpkin Pie | Dessert | 8 |
| 52858 | New York cheesecake | Dessert | 12 |
| 52859 | Key Lime Pie | Dessert | 8 |
| 52860 | Chocolate Raspberry Brownies | Dessert | 16 |
| 52861 | Peanut Butter Cheesecake | Dessert | 10 |
| 52862 | Peach & Blueberry Grunt | Dessert | 6 |
| 52863 | Vegetarian Casserole | Vegetarian | 4 |
| 52864 | Mushroom & Chestnut Rotolo | Vegetarian | 6 |
| 52865 | Matar Paneer | Vegetarian | 2 |
| 52866 | Squash linguine | Vegetarian | 4 |
| 52867 | Vegetarian Chilli | Vegetarian | 2 |
| 52868 | Kidney Bean Curry | Vegetarian | 3 |
| 52869 | Tahini Lentils | Vegetarian | 2 |
| 52870 | Chickpea Fajitas | Vegetarian | 2 |
| 52871 | Yaki Udon | Vegetarian | 2 |
| 52872 | Spanish Tortilla | Vegetarian | 4 |
| 52873 | Beef Dumpling Stew | Beef | 4 |
| 52874 | Beef and Mustard Pie | Beef | 6 |
| 52875 | Chicken Ham and Leek Pie | Chicken | 6 |
| 52876 | Minced Beef Pie | Beef | 4 |
| 52877 | Lamb and Potato pie | Lamb | 4 |
| 52878 | Beef and Oyster pie | Beef | 6 |
| 52879 | Chicken Parmentier | Chicken | 6 |
| 52880 | McSinghs Scotch pie | Lamb | 8 |
| 52881 | Steak and Kidney Pie | Beef | 4 |
| 52882 | Three Fish Pie | Seafood | 6 |
| 52883 | Sticky Toffee Pudding | Dessert | 8 |
| 52884 | Lancashire hotpot | Lamb | 6 |
| 52886 | Spotted Dick | Dessert | 6 |
| 52887 | Kedgeree | Seafood | 4 |
| 52888 | Eccles Cakes | Dessert | 8 |
| 52889 | Summer Pudding | Dessert | 6 |
| 52890 | Jam Roly-Poly | Dessert | 6 |
| 52891 | Blackberry Fool | Dessert | 6 |
| 52892 | Treacle Tart | Dessert | 8 |
| 52893 | Apple & Blackberry Crumble | Dessert | 4 |
| 52894 | Battenberg Cake | Dessert | 12 |
| 52895 | English Breakfast | Breakfast | 1 |
| 52896 | Full English Breakfast | Breakfast | 2 |
| 52897 | Carrot Cake | Dessert | 12 |
| 52898 | Chelsea Buns | Dessert | 12 |
| 52899 | Dundee cake | Dessert | 16 |
| 52900 | Madeira Cake | Dessert | 10 |
| 52901 | Rock Cakes | Dessert | 12 |
| 52902 | Parkin Cake | Dessert | 16 |
| 52903 | French Onion Soup | Side | 4 |
| 52904 | Beef Bourguignon | Beef | 4 |
| 52905 | Chocolate Souffle | Dessert | 6 |
| 52906 | Flamiche | Vegetarian | 6 |
| 52907 | Duck Confit | Miscellaneous | 4 |
| 52908 | Ratatouille | Vegetarian | 6 |
| 52909 | Tarte Tatin | Dessert | 6 |
| 52910 | Chinon Apple Tarts | Dessert | 2 |
| 52911 | Summer Pistou | Vegetarian | 4 |
| 52912 | Three-cheese souffles | Miscellaneous | 4 |
| 52913 | Brie wrapped in prosciutto & brioche | Side | 8 |
| 52914 | Boulangère Potatoes | Side | 6 |
| 52915 | French Omelette | Miscellaneous | 1 |
| 52916 | Pear Tarte Tatin | Dessert | 6 |
| 52917 | White chocolate creme brulee | Dessert | 6 |
| 52918 | Fish Stew with Rouille | Seafood | 2 |
| 52919 | Fennel Dauphinoise | Side | 2 |
| 52920 | Chicken Marengo | Chicken | 4 |
| 52921 | Provençal Omelette Cake | Vegetarian | 6 |
| 52922 | Prawn & Fennel Bisque | Side | 6 |
| 52923 | Canadian Butter Tarts | Dessert | 18 |
| 52924 | Nanaimo Bars | Dessert | 16 |
| 52925 | Split Pea Soup | Side | 6 |
| 52926 | Tourtiere | Pork | 6 |
| 52927 | Montreal Smoked Meat | Beef | 10 |
| 52928 | BeaverTails | Dessert | 12 |
| 52929 | Timbits | Dessert | 8 |
| 52930 | Pate Chinois | Beef | 4 |
| 52931 | Sugar Pie | Dessert | 8 |
| 52932 | Pouding chomeur | Dessert | 12 |
| 52933 | Rappie Pie | Chicken | 12 |
| 52934 | Chicken Basquaise | Chicken | 6 |
| 52935 | Steak Diane | Beef | 4 |
| 52936 | Saltfish and Ackee | Seafood | 4 |
| 52937 | Jerk chicken with rice & peas | Chicken | 6 |
| 52938 | Jamaican Beef Patties | Beef | 12 |
| 52939 | Callaloo Jamaican Style | Miscellaneous | 4 |
| 52940 | Brown Stew Chicken | Chicken | 4 |
| 52941 | Red Peas Soup | Beef | 8 |
| 52942 | Roast fennel and aubergine paella | Vegan | 4 |
| 52943 | Oxtail with broad beans | Beef | 3 |
| 52944 | Escovitch Fish | Seafood | 4 |
| 52945 | Kung Pao Chicken | Chicken | 4 |
| 52946 | Kung Po Prawns | Seafood | 4 |
| 52947 | Ma Po Tofu | Beef | 4 |
| 52948 | Wontons | Pork | 6 |
| 52949 | Sweet and Sour Pork | Pork | 2 |
| 52950 | Szechuan Beef | Beef | 4 |
| 52951 | General Tsos Chicken | Chicken | 2 |
| 52952 | Beef Lo Mein | Beef | 2 |
| 52953 | Shrimp Chow Fun | Seafood | 4 |
| 52954 | Hot and Sour Soup | Pork | 4 |
| 52955 | Egg Drop Soup | Vegetarian | 4 |
| 52956 | Chicken Congee | Chicken | 4 |
| 52957 | Fruit and Cream Cheese Breakfast Pastries | Breakfast | 18 |
| 52958 | Peanut Butter Cookies | Dessert | 12 |
| 52959 | Baked salmon with fennel & tomatoes | Seafood | 2 |
| 52960 | Salmon Avocado Salad | Seafood | 4 |
| 52961 | Budino Di Ricotta | Dessert | 8 |
| 52962 | Salmon Eggs Eggs Benedict | Breakfast | 2 |
| 52963 | Shakshuka | Vegetarian | 4 |
| 52964 | Smoked Haddock Kedgeree | Breakfast | 6 |
| 52965 | Breakfast Potatoes | Breakfast | 2 |
| 52966 | Chocolate Caramel Crispy | Dessert | 16 |
| 52967 | Home-made Mandazi | Breakfast | 12 |
| 52968 | Mbuzi Choma (Roasted Goat) | Goat | 6 |
| 52969 | Chakchouka  | Miscellaneous | 4 |
| 52970 | Tunisian Orange Cake | Dessert | 10 |
| 52971 | Kafteji | Vegetarian | 6 |
| 52972 | Tunisian Lamb Soup | Lamb | 4 |
| 52973 | Leblebi Soup | Vegetarian | 4 |
| 52974 | Keleya Zaara | Lamb | 4 |
| 52975 | Tuna and Egg Briks | Seafood | 4 |
| 52976 | Cashew Ghoriba Biscuits | Dessert | 20 |
| 52977 | Corba | Side | 4 |
| 52978 | Kumpir | Side | 2 |
| 52979 | Bitterballen (Dutch meatballs) | Beef | 8 |
| 52980 | Stamppot | Pork | 6 |
| 52981 | Snert (Dutch Split Pea Soup) | Side | 6 |
| 52982 | Spaghetti alla Carbonara | Pasta | 4 |
| 52987 | Lasagna Sandwiches | Pasta | 4 |
| 52988 | Classic Christmas pudding | Dessert | 16 |
| 52989 | Christmas Pudding Trifle | Dessert | 8 |
| 52990 | Christmas cake | Dessert | 16 |
| 52991 | Mince Pies | Dessert | 18 |
| 52992 | Soy-Glazed Meatloaves with Wasabi Mashed Potatoes & Roasted Carrots | Beef | 2 |
| 52993 | Honey Balsamic Chicken with Crispy Broccoli & Potatoes | Chicken | 2 |
| 52994 | Skillet Apple Pork Chops with Roasted Sweet Potatoes & Zucchini | Pork | 2 |
| 52995 | BBQ Pork Sloppy Joes | Pork | 2 |
| 52996 | French Onion Chicken with Roasted Carrots & Mashed Potatoes | Chicken | 2 |
| 52997 | Beef Banh Mi Bowls with Sriracha Mayo, Carrot & Pickled Cucumber | Beef | 2 |
| 52998 | Corned Beef and Cabbage | Beef | 6 |
| 52999 | Crispy Sausages and Greens | Pork | 4 |
| 53000 | Vegetable Shepherds Pie | Beef | 12 |
| 53005 | Strawberry Rhubarb Pie | Dessert | 8 |
| 53006 | Moussaka | Beef | 4 |
| 53007 | Honey Yogurt Cheesecake | Dessert | 12 |
| 53008 | Stuffed Lamb Tomatoes | Lamb | 4 |
| 53009 | Lamb and Lemon Souvlaki | Lamb | 4 |
| 53010 | Lamb Tzatziki Burgers | Lamb | 4 |
| 53011 | Chicken Quinoa Greek Salad | Chicken | 4 |
| 53012 | Gigantes Plaki | Vegetarian | 6 |
| 53013 | Big Mac | Beef | 2 |
| 53014 | Pizza Express Margherita | Miscellaneous | 2 |
| 53015 | Krispy Kreme Donut | Dessert | 24 |
| 53016 | Chick-Fil-A Sandwich | Chicken | 1 |
| 53017 | Paszteciki (Polish Pasties) | Beef | 4 |
| 53018 | Bigos (Hunters Stew) | Pork | 8 |
| 53019 | Pierogi (Polish Dumplings) | Side | 6 |
| 53020 | Rosol (Polish Chicken Soup) | Chicken | 6 |
| 53021 | Golabki (cabbage roll) | Beef | 6 |
| 53022 | Polskie Nalesniki (Polish Pancakes) | Dessert | 4 |
| 53023 | Sledz w Oleju (Polish Herrings) | Seafood | 6 |
| 53024 | Rogaliki (Polish Croissant Cookies) | Dessert | 60 |
| 53025 | Ful Medames | Vegetarian | 6 |
| 53026 | Tamiya | Vegetarian | 6 |
| 53027 | Koshari | Vegetarian | 6 |
| 53028 | Shawarma | Chicken | 6 |
| 53029 | Mulukhiyah | Beef | 4 |
| 53030 | Feteer Meshaltet | Side | 8 |
| 53031 | Egyptian Fatteh | Beef | 6 |
| 53032 | Tonkatsu pork | Pork | 4 |
| 53033 | Japanese gohan rice | Side | 4 |
| 53034 | Japanese Katsudon | Pork | 2 |
| 53035 | Ham hock colcannon | Pork | 4 |
| 53036 | Boxty Breakfast | Pork | 6 |
| 53037 | Coddled pork with cider | Pork | 2 |
| 53038 | Mustard champ | Side | 6 |
| 53039 | Piri-piri chicken and slaw | Chicken | 4 |
| 53040 | Spring onion and prawn empanadas | Seafood | 4 |
| 53041 | Grilled Portuguese sardines | Seafood | 4 |
| 53042 | Portuguese prego with green piri-piri | Beef | 2 |
| 53043 | Fish fofos | Seafood | 5 |
| 53044 | Portuguese barbecued pork (Febras assadas) | Pork | 4 |
| 53045 | Portuguese fish stew (Caldeirada de peixe) | Seafood | 6 |
| 53046 | Portuguese custard tarts | Dessert | 24 |
| 53047 | Moroccan Carrot Soup | Vegetarian | 4 |
| 53048 | Mee goreng mamak | Seafood | 4 |
| 53049 | Apam balik | Dessert | 16 |
| 53050 | Ayam Percik | Chicken | 4 |
| 53051 | Nasi lemak | Seafood | 4 |
| 53052 | Roti john | Beef | 2 |
| 53053 | Beef Rendang | Beef | 4 |
| 53054 | Seri muka kuih | Dessert | 12 |
| 53055 | Cevapi Sausages | Beef | 6 |
| 53056 | Croatian lamb peka | Beef | 4 |
| 53057 | Traditional Croatian Goulash | Beef | 4 |
| 53058 | Croatian Bean Stew | Beef | 6 |
| 53059 | Mushroom soup with buckwheat | Side | 3 |
| 53060 | Burek | Side | 4 |
| 53061 | Fresh sardines | Side | 2 |
| 53062 | Walnut Roll Gužvara | Dessert | 12 |
| 53063 | Chivito uruguayo | Beef | 2 |
| 53064 | Fettuccine Alfredo | Pasta | 4 |
| 53065 | Sushi | Seafood | 4 |
| 53067 | Stuffed Bell Peppers with Quinoa and Black Beans | Vegetarian | 4 |
| 53068 | Beef Mechado | Beef | 6 |
| 53069 | Bistek | Beef | 4 |
| 53070 | Beef Caldereta | Beef | 8 |
| 53071 | Beef Asado | Beef | 6 |
| 53072 | Crispy Eggplant | Vegetarian | 4 |
| 53073 | Eggplant Adobo | Vegetarian | 4 |
| 53074 | Grilled eggplant with coconut milk | Vegetarian | 6 |
| 53075 | Tortang Talong | Vegetarian | 4 |
| 53076 | Bread omelette | Breakfast | 1 |
| 53077 | Cabbage Soup (Shchi) | Vegetarian | 6 |
| 53078 | Beetroot Soup (Borscht) | Vegetarian | 4 |
| 53079 | Fish Soup (Ukha) | Seafood | 6 |
| 53080 | Blini Pancakes | Side | 4 |
| 53081 | Potato Salad (Olivier Salad) | Vegetarian | 6 |
| 53082 | Strawberries Romanoff | Dessert | 6 |
| 53083 | Lamb Pilaf (Plov) | Lamb | 4 |
| 53086 | Migas | Miscellaneous | 4 |
| 53089 | Syrian Bread | Miscellaneous | 8 |
| 53091 | Falafel Pita Sandwich with Tahini Sauce | Vegetarian | 6 |
| 53092 | Fasoliyyeh Bi Z-Zayt (Syrian Green Beans with Olive Oil) | Vegan | 4 |
| 53093 | Syrian Spaghetti | Pasta | 6 |
| 53094 | Baba Ghanoush | Side | 8 |
| 53095 | Syrian Rice with Meat | Miscellaneous | 8 |
| 53096 | Corned Beef Hash | Beef | 4 |
| 53097 | Yorkshire Puddings | Miscellaneous | 8 |
| 53098 | Cumberland Pie | Beef | 6 |
| 53099 | Aussie Burgers | Beef | 4 |
| 53100 | Blueberry & lemon friands | Dessert | 6 |
| 53101 | Chocolate Coconut Squares | Dessert | 16 |
| 53102 | Squid, chickpea & chorizo salad | Seafood | 6 |
| 53103 | Barramundi with Moroccan spices | Seafood | 2 |
| 53104 | Lamingtons | Dessert | 9 |
| 53105 | Spiced smoky barbecued chicken | Chicken | 6 |
| 53106 | Warm roast asparagus salad | Pork | 4 |
| 53107 | Avocado dip with new potatoes | Vegetarian | 10 |
| 53108 | Quick salt & pepper squid | Seafood | 4 |
| 53109 | Mini chilli beef pies | Beef | 12 |
| 53110 | Sticky Chicken | Chicken | 4 |
| 53111 | Anzac biscuits | Dessert | 20 |
| 53112 | Kenyan Beef Curry | Beef | 6 |
| 53113 | Sukuma Wiki | Vegetarian | 4 |
| 53114 | Ugali – Kenyan cornmeal | Breakfast | 4 |
| 53115 | Red onion pickle | Vegan | 12 |
| 53116 | Cinnamon buns | Dessert | 12 |
| 53117 | Nordic smørrebrød with asparagus and horseradish cream | Vegetarian | 4 |
| 53118 | Rømmegrøt – Norwegian Sour Cream Porridge | Breakfast | 4 |
| 53119 | Tall Skoleboller | Dessert | 6 |
| 53121 | Norwegian Potato Lefse | Side | 10 |
| 53122 | Fiskesuppe (Creamy Norwegian Fish Soup) | Seafood | 4 |
| 53123 | Fårikål (Norwegian National Dish) | Lamb | 4 |
| 53124 | Raspeballer (Norwegian Potato Dumplings) | Pork | 6 |
| 53125 | Karbonader (Lean Beef Patties) with Caramelized Onions | Beef | 3 |
| 53126 | Brun Lapskaus (Norwegian Beef Vegetable Stew) | Beef | 6 |
| 53127 | Authentic Norwegian Kransekake | Dessert | 20 |
| 53128 | Kvæfjord Cake “Verdens Beste” (World’s Best Cake) | Dessert | 12 |
| 53129 | Norwegian Krumkake | Dessert | 20 |
| 53130 | Suksessterte (Norwegian almond “success cake”) | Dessert | 12 |
| 53131 | Fyrstekake – Norwegian Prince Cake | Dessert | 10 |
| 53132 | Mazariner – Scandinavian Almond Tartlets | Dessert | 12 |
| 53133 | Asado | Beef | 8 |
| 53134 | Empanadas | Beef | 6 |
| 53135 | Milanesa | Beef | 4 |
| 53136 | Choripán | Pork | 4 |
| 53137 | Dulce de Leche | Dessert | 12 |
| 53138 | Alfajores | Dessert | 12 |
| 53139 | Fainá | Side | 6 |
| 53140 | Matambre a la Pizza | Beef | 6 |
| 53141 | Carbonada Criolla | Beef | 4 |
| 53142 | Spiced tortilla | Vegetarian | 4 |
| 53143 | Easy Spanish chicken | Chicken | 4 |
| 53144 | Gambas al ajillo | Seafood | 4 |
| 53145 | Jamon & wild garlic croquetas | Pork | 4 |
| 53146 | Locro | Miscellaneous | 8 |
| 53147 | Arroz con gambas y calamar | Seafood | 4 |
| 53148 | Crema Catalana | Dessert | 6 |
| 53149 | Ensaimada | Dessert | 4 |
| 53150 | Padron peppers | Vegan | 4 |
| 53151 | Paella | Seafood | 4 |
| 53152 | Pan-fried hake, white bean & chorizo broth | Seafood | 6 |
| 53153 | Churros | Dessert | 6 |
| 53154 | Clam, chorizo & white bean stew | Seafood | 2 |
| 53155 | Spanish chicken pie | Chicken | 4 |
| 53156 | Arroz al horno (baked rice) | Pork | 6 |
| 53157 | Chorizo & soft-boiled egg salad | Pork | 4 |
| 53158 | Air fryer patatas bravas | Vegetarian | 4 |
| 53159 | Chorizo, potato & cheese omelette | Pork | 1 |
| 53160 | Pisto con huevos | Vegetarian | 4 |
| 53161 | Chicken & chorizo rice pot | Chicken | 6 |
| 53162 | Pollo en pepitoria | Chicken | 4 |
| 53163 | Spanish fig & almond balls | Dessert | 6 |
| 53164 | Spanish Chicken | Chicken | 4 |
| 53165 | Torrijas with sherry | Breakfast | 2 |
| 53166 | Chickpea, chorizo & spinach stew | Pork | 4 |
| 53167 | Seafood rice | Seafood | 4 |
| 53168 | Chorizo & chickpea soup | Pork | 2 |
| 53169 | Ajo blanco | Starter | 4 |
| 53170 | Chocolate churros with chocolate & salted caramel sauce | Dessert | 6 |
| 53171 | Salt cod tortilla | Seafood | 6 |
| 53172 | Patatas bravas | Vegetarian | 4 |
| 53173 | Quick gazpacho | Starter | 2 |
| 53174 | Prawns with Romesco sauce | Seafood | 4 |
| 53175 | Spanish-style slow-cooked lamb shoulder & beans | Lamb | 8 |
| 53176 | Spanish tomato bread with jamón Serrano | Pork | 4 |
| 53177 | Spaghetti with Spanish flavours | Pork | 4 |
| 53178 | Fried calamari | Seafood | 4 |
| 53179 | Ham croquetas | Pork | 4 |
| 53180 | Garlicky prawns with sherry | Seafood | 4 |
| 53181 | Spanish beans with chicken & chorizo | Chicken | 6 |
| 53182 | Spanish seafood rice | Seafood | 4 |
| 53183 | Spanish meatballs with clams, chorizo & squid | Miscellaneous | 4 |
| 53184 | Spanish rice & prawn one-pot | Seafood | 4 |
| 53185 | Chorizo & tomato salad | Pork | 2 |
| 53186 | Chicken with saffron, raisins & pine nuts | Chicken | 4 |
| 53187 | Šúĺlance s Makom | Dessert | 4 |
| 53188 | Fašírky | Pork | 4 |
| 53189 | Zemiakové Placky | Side | 4 |
| 53190 | Bryndzové Halušky | Pork | 4 |
| 53191 | Pad Thai | Seafood | 2 |
| 53192 | Panang chicken curry (kaeng panang gai) | Chicken | 2 |
| 53193 | Drunken noodles (pad kee mao) | Beef | 2 |
| 53194 | Tom yum soup with prawns | Seafood | 4 |
| 53195 | Thai curry noodle soup | Seafood | 2 |
| 53196 | Tom yum (hot & sour) soup with prawns | Seafood | 2 |
| 53197 | Thai pork & peanut curry | Pork | 4 |
| 53198 | Thai fried rice with prawns & peas | Seafood | 4 |
| 53199 | Thai beef stir-fry | Beef | 4 |
| 53200 | Prawn stir-fry | Seafood | 2 |
| 53201 | Stir-fried chicken with chillies & basil | Chicken | 4 |
| 53202 | Thai-style steamed fish | Seafood | 2 |
| 53203 | Thai rice noodle salad | Vegetarian | 4 |
| 53204 | Red curry chicken kebabs | Chicken | 2 |
| 53205 | Thai prawn curry | Seafood | 4 |
| 53206 | Thai chicken cakes with sweet chilli sauce | Chicken | 3 |
| 53207 | Tom kha gai | Chicken | 4 |
| 53208 | Thai coconut & veg broth | Vegetarian | 4 |
| 53209 | Spicy Thai prawn noodles | Seafood | 4 |
| 53210 | Thai pumpkin soup | Vegetarian | 4 |
| 53211 | Lemongrass beef stew with noodles | Beef | 2 |
| 53212 | Thai drumsticks | Chicken | 4 |
| 53213 | Thai-style fish broth with greens | Seafood | 2 |
| 53214 | Thai green chicken soup | Chicken | 6 |
| 53215 | Shakshouka | Miscellaneous | 2 |
| 53216 | Knafeh | Dessert | 8 |
| 53217 | Shawarma chuck roast wrap | Beef | 6 |
| 53218 | Chicken Shawarma with homemade garlic herb yoghurt sauce | Chicken | 4 |
| 53219 | Shakshuka Feta Cheese | Miscellaneous | 2 |
| 53220 | kabse | Chicken | 4 |
| 53221 | Mamoul (Eid biscuits) | Dessert | 24 |
| 53222 | Vegetarian Shakshuka | Vegetarian | 2 |
| 53223 | Mutabbaq | Miscellaneous | 6 |
| 53224 | Pistachio Kunafa Chocolate Cake and Cupcakes | Dessert | 8 |
| 53225 | Yemeni Lahsa (Elite Shakshuka) | Breakfast | 2 |
| 53226 | Shawarma bread | Side | 4 |
| 53227 | Rice paper dumplings | Pork | 4 |
| 53228 | Vietnamese caramel trout | Seafood | 2 |
| 53229 | Steak & Vietnamese noodle salad | Beef | 2 |
| 53230 | Purple sprouting broccoli tempura with nuoc cham | Miscellaneous | 4 |
| 53231 | Vietnamese lamb shanks with sweet potatoes | Lamb | 4 |
| 53232 | Vietnamese chicken salad | Chicken | 4 |
| 53233 | Salt & pepper squid | Seafood | 4 |
| 53234 | Salmon noodle soup | Seafood | 4 |
| 53235 | Vietnamese-style caramel pork | Pork | 4 |
| 53236 | Vietnamese-style veggie hotpot | Vegetarian | 2 |
| 53237 | Vietnamese pork salad | Pork | 4 |
| 53238 | Beef pho | Beef | 2 |
| 53239 | Bang bang prawn salad | Seafood | 2 |
| 53240 | Tofu, greens & cashew stir-fry | Vegetarian | 4 |
| 53241 | Vietnamese veg parcels | Vegetarian | 4 |
| 53242 | Barbecue pork buns | Pork | 12 |
| 53243 | Vietnamese prawn spiralized rolls | Seafood | 2 |
| 53244 | Prawn & noodle salad with crispy shallots | Seafood | 4 |
| 53245 | Noodle bowl salad | Seafood | 2 |
| 53246 | Tangy carrot, cabbage & onion salad | Vegetarian | 4 |
| 53247 | Sea bass with sizzled ginger, chilli & spring onions | Seafood | 6 |
| 53248 | Salmon noodle wraps | Seafood | 2 |
| 53249 | Turkey Bánh mì | Miscellaneous | 2 |
| 53250 | Vegan banh mi | Vegan | 4 |
| 53251 | Turkish lahmacun | Beef | 4 |
| 53252 | Turkish rice (vermicelli rice) | Miscellaneous | 4 |
| 53253 | Imam bayildi with BBQ lamb & tzatziki | Lamb | 6 |
| 53254 | Ezme | Vegetarian | 6 |
| 53255 | Grilled aubergines with spicy chickpeas & walnut sauce | Vegetarian | 4 |
| 53256 | Cacik | Side | 4 |
| 53257 | kofta burgers | Lamb | 8 |
| 53258 | Hot cumin lamb wrap with crunchy slaw & spicy mayo | Lamb | 4 |
| 53259 | Smoked aubergine purée | Side | 4 |
| 53260 | Slow-roast lamb with cinnamon, fennel & citrus | Lamb | 6 |
| 53261 | Chicken wings with cumin, lemon & garlic | Chicken | 4 |
| 53262 | Adana kebab | Lamb | 4 |
| 53263 | Turkish lamb pilau | Lamb | 4 |
| 53264 | Smoky chicken skewers | Chicken | 4 |
| 53265 | Chilli ginger lamb chops | Lamb | 4 |
| 53266 | Falafel | Vegetarian | 3 |
| 53267 | Aubergine couscous salad | Vegetarian | 2 |
| 53268 | Roasted chicken with creamy walnut sauce | Chicken | 6 |
| 53269 | Hummus | Side | 4 |
| 53270 | Turkish-style lamb | Lamb | 4 |
| 53271 | Walnut, date & honey cake | Dessert | 10 |
| 53272 | Griddled flatbreads | Side | 16 |
| 53273 | Roast aubergine with goat's cheese & toasted flatbread | Vegetarian | 2 |
| 53274 | Griddled aubergines with sesame dressing | Vegetarian | 4 |
| 53275 | Sweet potato salad | Vegetarian | 8 |
| 53276 | Apricot & Turkish delight mess | Dessert | 2 |
| 53277 | Lamb & apricot meatballs | Lamb | 4 |
| 53278 | Aubergine & hummus grills | Vegetarian | 4 |
| 53279 | Baklava with spiced nuts, ricotta & chocolate | Dessert | 24 |
| 53280 | Poulet Roti a l'Algerienne (Algerian Roast Chicken) | Chicken | 4 |
| 53281 | Algerian Kefta (Meatballs) | Beef | 4 |
| 53282 | Algerian Carrots | Side | 6 |
| 53283 | Chtitha Batata (Algerian Potato Stew) | Vegetarian | 4 |
| 53284 | Algerian Bouzgene Berber Bread with Roasted Pepper Sauce | Side | 6 |
| 53285 | Dziriat (Algerian Almond Tarts) | Dessert | 24 |
| 53286 | Khobz el Dar (Algerian Semolina Bread) | Side | 10 |
| 53287 | Tajine de Poulet aux Carottes et Patates Douces (Chicken and Sweet Potato Tagine) | Chicken | 4 |
| 53288 | Algerian Flafla (Bell Pepper Salad) | Vegetarian | 4 |
| 53289 | Chorba Hamra bel Frik (Algerian Lamb, Tomato, and Freekeh Soup) | Lamb | 4 |
| 53290 | Cheese Borek | Side | 12 |
| 53291 | Cornes de Gazelle (Gazelle Horns) | Dessert | 24 |
| 53292 | Piernik (Polish gingerbread) | Dessert | 12 |
| 53293 | Pistachio cake | Dessert | 12 |
| 53294 | Zapiekanki | Pork | 4 |
| 53295 | Polish chocolate & walnut cake | Dessert | 12 |
| 53296 | Sauerkraut pierogi | Vegetarian | 4 |
| 53297 | Pomegranate salad | Vegetarian | 4 |
| 53298 | Polish doughnuts (Pączki) | Dessert | 16 |
| 53299 | Polish patties (kotlety) | Side | 4 |
| 53300 | Bigos (Polish hunter's stew) | Beef | 8 |
| 53301 | Pork & sauerkraut goulash | Pork | 6 |
| 53302 | Slow-roasted ham with lemon, garlic & sage | Pork | 8 |
| 53303 | Raspberry mousse | Dessert | 6 |
| 53304 | Mini bundt cakes | Dessert | 8 |
| 53305 | Braised stuffed cabbage | Vegetarian | 4 |
| 53306 | Pork rib bortsch | Pork | 8 |
| 53307 | Beetroot & red cabbage sauerkraut | Vegetarian | 12 |
| 53308 | Rye bread | Side | 12 |
| 53309 | Cucumber & fennel salad | Vegetarian | 4 |
| 53310 | Challah | Side | 10 |
| 53311 | Borsch | Beef | 8 |
| 53312 | Tangy cabbage slaw | Vegetarian | 8 |
| 53313 | Beetroot latkes | Vegetarian | 2 |
| 53314 | Sauerkraut pierogii | Vegetarian | 4 |
| 53315 | Rosemary braised red cabbage with kabanos | Pork | 4 |
| 53316 | Beetroot pancakes | Dessert | 4 |
| 53317 | Beef Empanadas | Beef | 8 |
| 53318 | Torta de fiambre | Pork | 8 |
| 53319 | Chivito sandwich | Beef | 8 |
| 53320 | Chocolate alfajores | Dessert | 20 |
| 53321 | Vanilla alfajores | Dessert | 10 |
| 53322 | Flan | Dessert | 4 |
| 53323 | Postre Chajá | Dessert | 8 |
| 53324 | Chocolate empanadas | Dessert | 6 |
| 53325 | Venezuelan Arepas | Side | 4 |
| 53326 | Venezuelan Sancocho | Beef | 8 |
| 53327 | Venezuelan Coconut Chicken | Chicken | 4 |
| 53328 | Venezuelan Shredded Beef | Beef | 6 |
| 53329 | Arepa pelua | Beef | 6 |
| 53330 | Cassava pizza | Pork | 6 |
| 53331 | Oatmeal pancakes | Breakfast | 2 |
| 53332 | Venezuelan turnovers | Side | 6 |
| 53333 | Passion fruit mousse | Dessert | 8 |
| 53334 | Arepa Pabellón | Beef | 8 |
| 53335 | Jiggs Dinner | Beef | 8 |
| 53336 | Molasses Baked Beans | Vegetarian | 8 |
| 53337 | Saskatoon Pie | Dessert | 8 |
| 53338 | Date squares | Dessert | 16 |
| 53339 | Jam jam cookies | Dessert | 24 |
| 53340 | Hodge Podge | Vegetarian | 6 |
| 53341 | Flapper Pie | Dessert | 8 |
| 53342 | Figgy Duff | Dessert | 8 |
| 53343 | Classic Tourtière | Beef | 6 |
| 53344 | Jamaican Sweet Potato Pudding | Dessert | 10 |
| 53345 | Jamaican Curry Chicken Recipe | Chicken | 4 |
| 53346 | Grape Nut Ice Cream | Dessert | 8 |
| 53347 | No-Churn Rum Raisin Ice Cream | Dessert | 8 |
| 53348 | Jamaican Spice Bun Recipe | Dessert | 10 |
| 53349 | Jamaican Pepper Shrimp | Seafood | 4 |
| 53350 | Corned Beef and Cabbage – Jamaican Style | Beef | 4 |
| 53351 | Jamaican Banana Fritters | Dessert | 4 |
| 53352 | Jamaican Instant Pot Rice and Beans | Vegetarian | 6 |
| 53353 | Jamaican Boiled Dumplings | Side | 4 |
| 53354 | Jamaican Curry Goat | Goat | 6 |
| 53355 | Jamaican Festival (Sweet Dumpling) | Side | 12 |
| 53356 | Jamaican Fried Dumplings | Side | 10 |
| 53357 | Jamaican Rice and Peas | Vegetarian | 6 |
| 53358 | Chicken Mandi | Chicken | 4 |
| 53359 | Beef Mandi | Beef | 8 |
| 53360 | Caribbean Tamarind balls | Dessert | 24 |
| 53361 | Callaloo and SaltFish | Side | 4 |
| 53362 | Jamaican Curry Shrimp Recipe | Seafood | 4 |
| 53363 | Jamaican Cornmeal Porridge | Breakfast | 4 |
| 53364 | Jamaican Steamed Cabbage | Side | 4 |
| 53365 | Chinese Orange Chicken | Chicken | 4 |
| 53366 | Beef and Broccoli Stir-Fry | Beef | 4 |
| 53367 | Chicken Fried Rice | Chicken | 4 |
| 53368 | Singapore Noodles with Shrimp | Seafood | 4 |
| 53369 | Silken Tofu with Sesame Soy Sauce | Vegetarian | 4 |
| 53370 | Egg Foo Young | Seafood | 4 |
| 53371 | Sichuan Style Stir-Fried Chinese Long Beans | Vegetarian | 4 |
| 53372 | Chinese Tomato Egg Stir Fry | Vegetarian | 4 |
| 53373 | Air Fryer Egg Rolls | Side | 6 |
| 53374 | Sichuan Eggplant | Vegetarian | 4 |
| 53375 | Shrimp With Snow Peas | Seafood | 4 |
| 53376 | Sweet and Sour Chicken | Chicken | 4 |
| 53377 | Napa Cabbage with Dried Shrimp | Seafood | 4 |
| 53378 | Sesame Cucumber Salad | Side | 4 |
| 53379 | Dutch poffertjes (mini pancakes) | Breakfast | 4 |
| 53380 | Apple cake | Dessert | 8 |
| 53381 | Gevulde speculaas | Dessert | 12 |
| 53382 | Dutch stroopwafel | Dessert | 14 |
| 53383 | Ramen Noodles with Boiled Egg | Miscellaneous | 1 |
| 53385 | Boterkoek (Dutch Butter Cake) | Dessert | 8 |
| 53386 | Dutch Apple Pie | Dessert | 12 |
| 53387 | Dutch Spiced Breakfast Cake (Ontbijtkoek) | Dessert | 12 |
| 53388 | Runner Bean Mash (Snijbonen Stamppot) | Side | 4 |
| 53389 | Apple Potato Mash (Hete bliksem)  | Side | 2 |
| 53391 | Traditional Dutch rice tart (rijstevlaai) | Dessert | 8 |
| 53392 | Arnhemse meisjes | Dessert | 12 |
| 53393 | Dutch doughnuts | Dessert | 10 |
| 53394 | Zeeuwse bolussen | Dessert | 10 |
| 53395 | Slagroomtaart | Dessert | 12 |
| 53396 | Baghlaw-e-Khanagi | Dessert | 12 |
| 53397 | Haft Mewa Recipe | Side | 8 |
| 53398 | Kadu Borani | Vegetarian | 4 |
| 53399 | Firni | Dessert | 8 |
| 53400 | Mastawa Lamb and Rice | Lamb | 6 |
| 53401 | Bolani with Potato Filling | Side | 6 |
| 53402 | Mantu Afghan Dumpling | Starter | 6 |
| 53403 | Muraba-E-Kadu (Pumpkin Jam) | Miscellaneous | 24 |
| 53404 | Tavë Kosi Baked Lamb and Yogurt | Lamb | 4 |
| 53405 | Tavë me Presh ska Mish Meatless Leek Bake | Vegetarian | 4 |
| 53406 | Arra të Mbushura me Fik Walnut Stuffed Figs (with Fig Syrup) | Dessert | 2 |
| 53407 | Lakror me Kungull Summer Squash Pie | Vegetarian | 6 |
| 53408 | Kulaç Soda Bread | Side | 8 |
| 53409 | Shendetlie Honey and Nut Cake | Dessert | 16 |
| 53410 | Presh me Oriz Leek and Rice Bake | Lamb | 4 |
| 53411 | Dolma Japrak Stuffed Vine Leaves | Side | 6 |
| 53412 | Lakra me Mish Cabbage and Meat Stew | Beef | 4 |
| 53413 | Flija Layered Pancake / Crepe | Breakfast | 10 |
| 53414 | Kurabie Butter Cookies | Dessert | 20 |
| 53415 | Torrijas | Breakfast | 8 |
| 53416 | Trinxat (Potato, Cabbage and Bacon Hash) | Pork | 4 |
| 53417 | Pa Amb Tomaquet (Bread with Tomato) | Vegetarian | 2 |
| 53418 | Cambodian Stir-fried Morning Glory with Pork, Fermented Soybeans, and Garlic | Pork | 4 |
| 53419 | Crispy fried fish with ginger and fermented soybeans (trey chien chuon) | Seafood | 4 |
| 53420 | Cambodian Waffles (Num Poum) | Dessert | 4 |
| 53421 | BEEF LOK LAK (Lok Lak Sach Ko) | Beef | 4 |
| 53422 | Num E (Sticky Rice Balls in Sugar Syrup and Coconut Cream) | Side | 10 |
| 53423 | Meang Nem | Seafood | 6 |
| 53424 | Laos Plantain Coconut Bake (Flourless Muffin) | Dessert | 12 |
| 53425 | Authentic Laos Tapioca Pudding with Bananas | Dessert | 6 |
| 53426 | Lao Som Pak Pickled Cabbage | Side | 8 |
| 53427 | Lao Naem Khao | Pork | 6 |
| 53428 | Camaro Grelhado Com Molho Cru (Grilled Prawns with Green Onion Sauce) | Seafood | 4 |
| 53429 | Paracuca (Roasted Peanuts) | Starter | 10 |
| 53430 | Antiguan Breakfast (Chop Up and ‘Saltfish’) | Breakfast | 6 |
| 53431 | Corn on the cob with lime, green chilli and coconut butter | Side | 6 |
| 53432 | Slow-cooked, Wadadli-spiced Cubano pork belly | Pork | 8 |
| 53433 | Mango chow | Side | 2 |
| 53434 | Koulenje | Side | 24 |
| 53435 | Stuffed Grape Leaves | Side | 6 |
| 53436 | Jajek | Side | 4 |
| 53437 | Leg of Lamb Armenian-Style | Lamb | 8 |
| 53438 | Bolita di Keshi | Miscellaneous | 10 |
| 53439 | Arepa | Side | 4 |
| 53440 | Balchi di Pisca | Seafood | 4 |
| 53441 | Banana den Forno | Dessert | 4 |
| 53442 | Cheese Sticks | Side | 8 |
| 53443 | Satee | Beef | 12 |
| 53444 | Tirolean Dumplings | Pork | 4 |
| 53445 | Kaspressknödel - Cheese Dumplings | Vegetarian | 4 |
| 53446 | Clear Soup with Semolina Dumplings | Miscellaneous | 4 |
| 53447 | Tafelspitz | Beef | 6 |
| 53448 | Tendir Choreyi (Tandoori Bread) | Side | 8 |
| 53449 | Kelem dolmasi | Lamb | 4 |
| 53450 | Grits | Breakfast | 1 |
| 53451 | Bangladeshi fish curry with daikon | Seafood | 4 |
| 53452 | Handesh – Bangladeshi rice flour and date molasses cakes | Dessert | 12 |
| 53453 | Bengali Chicken Curry with Potatoes | Chicken | 4 |
| 53454 | Breadfruit in Butter Sauce Recipe | Dessert | 4 |
| 53455 | Chicken Liver Pate Recipe | Chicken | 8 |
| 53456 | Bajan Salt Bread Recipe | Side | 12 |
| 53457 | Barbados Pepperpot | Beef | 8 |
| 53458 | Breadfruit in Butter Sauce | Side | 4 |
| 53459 | Chicken and Potato Roti | Chicken | 6 |
| 53460 | Bajan Sweet Bread | Side | 12 |
| 53461 | Macaroni Pie | Pasta | 6 |
| 53462 | Cinnamon Roll Cookies | Dessert | 20 |
| 53463 | Belgian Meatballs in Liège Syrup Sauce | Beef | 4 |
| 53464 | Flemish Hutsepot | Pork | 4 |
| 53465 | Frog Legs Recipe in Garlic Butter | Miscellaneous | 2 |
| 53466 | Belgian Waterzooi Chicken | Chicken | 2 |
| 53467 | Liegeoise Salad | Vegetarian | 2 |
| 53468 | Belgian Stoemp | Pork | 2 |
| 53469 | Beef pumpkin Stew | Beef | 10 |
| 53470 | Seswaa | Beef | 6 |
| 53471 | Phaphatha Flatbreads | Side | 12 |
| 53472 | Madombi: Dumplings from Botswana | Miscellaneous | 6 |
| 53473 | Curried Spinach from Botswana | Side | 4 |
| 53474 | Magwinya: Doughnut Bites from Botswana | Dessert | 12 |
| 53475 | Brazilian chocolate truffles - brigadeiro | Dessert | 20 |
| 53476 | Brazilian cheese bread (pão de queijo) | Side | 8 |
| 53477 | Coconut quindim | Dessert | 4 |
| 53478 | Grilled corn with garlic mayo & grated cheese | Vegetarian | 6 |
| 53479 | Smoky tomato pepper salsa | Side | 4 |
| 53480 | Creamy Aji green sauce | Vegetarian | 6 |
| 53481 | Bahia-style Moqueca prawn stew | Seafood | 4 |
| 53482 | Black bean & meat stew - feijoada | Beef | 6 |
| 53483 | Acaraje black-eyed pea fritters with shrimp filling | Seafood | 8 |
| 53484 | Simple heart of palm & tomato salad | Starter | 4 |
| 53485 | Brazilian carrot cake | Dessert | 10 |
| 53486 | Easy White Bean Soup | Vegetarian | 8 |
| 53487 | Oyster Mushroom Soup | Starter | 4 |
| 53488 | Cabbage with Ground Beef | Beef | 4 |
| 53489 | Potato Moussaka Recipe | Beef | 6 |
| 53490 | Cottage Cheese And Feta Stuffed Peppers | Vegetarian | 4 |
| 53491 | Shopska Salad | Vegetarian | 4 |
| 53492 | Bulgarian Green Salad | Side | 4 |
| 53493 | Bulgarian Honey Cookies | Dessert | 30 |
| 53494 | Keto Banitsa | Side | 6 |
| 53495 | Amok Trey – Cambodian Fish Curry | Seafood | 4 |
| 53496 | Bai Sach Chrouk – Grilled Pork with Rice | Pork | 4 |
| 53497 | Nom Banh Chok – Cambodian Noodle Soup | Chicken | 4 |
| 53498 | Samlar Kari – Khmer Red Curry | Chicken | 4 |
| 53499 | Prahok Ktis – Pork and Coconut Dip | Pork | 6 |
| 53500 | Num Ansom – Sticky Rice Cake | Side | 8 |
| 53501 | Num Pang – Cambodian Baguette Sandwich | Chicken | 4 |
| 53502 | Khmer Banh Xeo – Cambodian Savory Pancake | Pork | 4 |
| 53503 | Samlar Machu Kreung – Cambodian Sour Stew | Chicken | 4 |
| 53504 | Macaroni Pudding | Pasta | 12 |
| 53505 | Conch Fritters | Seafood | 6 |
| 53506 | Rice and Beans | Vegetarian | 6 |
| 53507 | Cayman Style Potato Salad | Side | 8 |
| 53508 | Cassava Cake | Dessert | 10 |
| 53509 | Fried Crab | Seafood | 4 |
| 53510 | Cayman-Style Lobster | Seafood | 6 |
| 53511 | Salt Beef and Beans | Beef | 4 |
| 53512 | Conch Stew | Seafood | 4 |
| 53513 | Chilean-Style Sopaipillas | Side | 12 |
| 53514 | Chilean Empanada | Pork | 12 |
| 53515 | Manjar (Dulce de Leche) | Dessert | 8 |
| 53516 | Chilean Dobladitas | Side | 8 |
| 53517 | Pastel de Papas (Chilean Potato Pie) | Beef | 6 |
| 53518 | Empanadas Fritas de Queso | Vegetarian | 6 |
| 53519 | Leche Asada | Dessert | 6 |
| 53520 | Pastel de Choclo | Chicken | 6 |
| 53521 | Porotos Granados (Chilean Bean Stew) | Miscellaneous | 6 |
| 53522 | Arroz con Leche Recipe | Dessert | 6 |
| 53523 | Colombian Buñuelos Recipe | Side | 6 |
| 53524 | Coconut Natilla Recipe | Dessert | 8 |
| 53525 | Ají de Aguacate Recipe (Colombian Spicy Avocado Sauce) | Miscellaneous | 8 |
| 53526 | Colombian Style Stuffed Potatoes | Starter | 5 |
| 53527 | Achiote Oil (Aceite Achiotado) Recipe | Miscellaneous | 16 |
| 53528 | Chuletas de Cerdo a la Criolla (Pork Chops in Creole Sauce) | Pork | 4 |
| 53529 | Almojábanas (Colombian Cheese Bread) | Side | 8 |
| 53530 | Creamy Mustard Chicken | Chicken | 4 |
| 53531 | Chicken in Orange Sauce Recipe (Pollo a la Naranja) | Chicken | 4 |
| 53532 | Creamy Corn Soup Recipe | Vegetarian | 6 |
| 53533 | Breaded Steak Recipe (Lomo de Res Apanado) | Beef | 4 |
| 53534 | Papas Chorreadas Recipe (Potatoes with Cream and Cheese Sauce) | Miscellaneous | 4 |
| 53535 | Tamal De Maicena | Dessert | 12 |
| 53536 | Black Beans Hotpot | Vegetarian | 6 |
| 53537 | Pan De Yucca | Dessert | 12 |
| 53538 | Mango Tropical Salsa | Side | 8 |
| 53539 | Picadillo de Vainicas (Green Beans Picadillo) | Beef | 4 |
| 53540 | Pollo en Salsa | Chicken | 4 |
| 53541 | Gallo pinto | Vegetarian | 4 |
| 53542 | Chorreadas | Dessert | 4 |
| 53543 | Dulce de Leche Cheesecake with a Maria Cookie Crust. | Dessert | 12 |
| 53544 | CAFE LA LLAVE ESPRESSO ICE CREAM | Dessert | 8 |
| 53545 | Ropa Veija | Beef | 6 |
| 53546 | Black Bean soup | Starter | 6 |
| 53547 | Cuban Sandwich | Pork | 2 |
| 53548 | Baked Yuca Fries | Side | 4 |
