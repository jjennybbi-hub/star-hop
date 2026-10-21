/* Bright-star catalogue, J2000.0.  id|name|bayer|RA(h)|Dec(deg)|V mag|B-V|dist(ly)|spectral */
const STAR_SRC = `
uma-alp|Dubhe|α|11.0622|61.7511|1.79|1.07|123|K0III
uma-bet|Merak|β|11.0307|56.3824|2.37|0.03|79|A1V
uma-gam|Phecda|γ|11.8972|53.6948|2.44|0.04|84|A0V
uma-del|Megrez|δ|12.2571|57.0326|3.31|0.08|81|A3V
uma-eps|Alioth|ε|12.9005|55.9598|1.77|-0.02|83|A1III
uma-zet|Mizar|ζ|13.3988|54.9254|2.27|0.02|83|A2V
uma-eta|Alkaid|η|13.7923|49.3133|1.86|-0.19|104|B3V
uma-alc|Alcor|80|13.4204|54.9880|4.01|0.16|82|A5V
uma-omi|Muscida|ο|8.5049|60.7181|3.36|0.84|179|G4II
uma-ups||υ|9.8494|59.0389|3.80|0.30|115|F0IV
uma-the||θ|9.5479|51.6773|3.17|0.46|44|F6IV
uma-iot|Talitha|ι|8.9862|48.0418|3.14|0.22|48|A7IV
uma-kap||κ|9.0601|47.1564|3.60|0.03|358|A1V
uma-lam|Tania Borealis|λ|10.2851|42.9146|3.45|0.03|135|A2IV
uma-mu|Tania Australis|μ|10.3722|41.4996|3.05|1.59|249|M0III
uma-nu|Alula Borealis|ν|11.3079|33.0942|3.49|1.40|399|K3III
uma-xi|Alula Australis|ξ|11.3031|31.5292|3.79|0.59|29|G0V
uma-psi||ψ|11.1615|44.4985|3.01|1.14|147|K1III
uma-chi||χ|11.7679|47.7794|3.69|1.18|196|K0III
umi-alp|Polaris|α|2.5303|89.2641|1.98|0.60|433|F7Ib
umi-bet|Kochab|β|14.8451|74.1555|2.08|1.47|131|K4III
umi-gam|Pherkad|γ|15.3453|71.8340|3.05|0.09|487|A3II
umi-del|Yildun|δ|17.5369|86.5865|4.36|0.02|183|A1V
umi-eps||ε|16.7661|82.0373|4.23|0.89|347|G5III
umi-zet||ζ|15.7345|77.7944|4.29|0.04|376|A3V
umi-eta||η|16.2918|75.7551|4.95|0.37|97|F5V
cas-alp|Schedar|α|0.6751|56.5373|2.24|1.17|228|K0III
cas-bet|Caph|β|0.1529|59.1498|2.28|0.34|55|F2III
cas-gam|Navi|γ|0.9451|60.7167|2.47|-0.15|550|B0IV
cas-del|Ruchbah|δ|1.4303|60.2353|2.68|0.13|99|A5III
cas-eps|Segin|ε|1.9066|63.6701|3.38|-0.15|410|B3III
cep-alp|Alderamin|α|21.3096|62.5856|2.45|0.22|49|A7IV
cep-bet|Alfirk|β|21.4776|70.5607|3.23|-0.20|690|B2III
cep-gam|Errai|γ|23.6558|77.6320|3.21|1.03|45|K1IV
cep-del||δ|22.4870|58.4152|4.07|0.66|887|F5Ib
cep-zet||ζ|22.1811|58.2012|3.35|1.56|726|K1Ib
cep-eta||η|20.7546|61.8387|3.43|0.92|47|K0IV
cep-iot||ι|22.8281|66.2005|3.52|1.05|115|K0III
cep-eps||ε|22.2500|57.0435|4.19|0.42|84|F0IV
dra-alp|Thuban|α|14.0730|64.3757|3.65|-0.05|303|A0III
dra-bet|Rastaban|β|17.5071|52.3014|2.79|0.95|380|G2II
dra-gam|Eltanin|γ|17.9434|51.4889|2.23|1.52|154|K5III
dra-del|Altais|δ|19.2092|67.6615|3.07|1.00|97|G9III
dra-eps||ε|19.8026|70.2679|3.83|0.89|148|G7III
dra-zet|Aldhibah|ζ|17.1465|65.7146|3.17|-0.12|330|B6III
dra-eta|Athebyne|η|16.3998|61.5141|2.73|0.91|88|G8III
dra-the||θ|16.0313|58.5651|4.01|0.53|70|F8IV
dra-iot|Edasich|ι|15.4152|58.9661|3.29|1.17|102|K2III
dra-kap||κ|12.5583|69.7882|3.87|-0.13|490|B6III
dra-lam|Giausar|λ|11.5232|69.3312|3.84|1.62|334|M0III
dra-xi|Grumium|ξ|17.8922|56.8726|3.75|1.18|112|K2III
dra-nu||ν|17.5322|55.1840|4.88|0.36|99|A8V
dra-chi||χ|18.3518|72.7331|3.57|0.49|27|F7V
dra-phi||φ|18.3463|71.3378|4.22|0.00|310|A0V
lyr-alp|Vega|α|18.6156|38.7837|0.03|0.00|25|A0V
lyr-bet|Sheliak|β|18.8347|33.3627|3.45|0.00|960|B7II
lyr-gam|Sulafat|γ|18.9824|32.6896|3.24|-0.05|620|B9III
lyr-del||δ|18.9083|36.8986|4.30|1.68|900|M4II
lyr-zet||ζ|18.7462|37.6051|4.36|0.19|154|A4IV
lyr-eps|Double Double|ε|18.7383|39.6701|4.59|0.19|162|A4V
cyg-alp|Deneb|α|20.6905|45.2803|1.25|0.09|2615|A2Ia
cyg-bet|Albireo|β|19.5120|27.9597|3.08|1.09|430|K3II
cyg-gam|Sadr|γ|20.3705|40.2567|2.23|0.68|1800|F8Ib
cyg-del||δ|19.7498|45.1308|2.87|-0.10|165|B9III
cyg-eps|Aljanah|ε|20.7701|33.9703|2.48|1.02|72|K0III
cyg-zet||ζ|21.2150|30.2265|3.20|1.00|151|G8III
cyg-iot||ι|19.4948|51.7295|3.79|0.14|121|A5V
cyg-kap||κ|19.2851|53.3684|3.77|0.95|124|G9III
aql-alp|Altair|α|19.8464|8.8683|0.77|0.22|17|A7V
aql-bet|Alshain|β|19.9212|6.4068|3.71|0.86|45|G8IV
aql-gam|Tarazed|γ|19.7709|10.6133|2.72|1.52|395|K3II
aql-del||δ|19.4250|3.1148|3.36|0.32|50|F0IV
aql-zet|Okab|ζ|19.0904|13.8635|2.99|0.01|83|A0V
aql-the||θ|20.1883|-0.8215|3.23|-0.07|288|B9V
aql-lam|Althalimain|λ|19.1042|-4.8827|3.44|-0.09|125|B9V
aql-eta||η|19.8746|1.0058|3.90|0.79|1400|F6Ib
aql-eps||ε|18.9938|15.0684|4.02|1.08|154|K1III
her-alp|Rasalgethi|α|17.2443|14.3903|3.48|1.44|360|M5Ib
her-bet|Kornephoros|β|16.5036|21.4896|2.78|0.94|139|G7III
her-gam||γ|16.3646|19.1531|3.75|0.27|195|A9III
her-del|Sarin|δ|17.2505|24.8392|3.12|0.08|75|A3IV
her-eps||ε|17.0047|30.9263|3.92|0.00|163|A0V
her-zet||ζ|16.6882|31.6020|2.81|0.65|35|F9IV
her-eta||η|16.7146|38.9224|3.53|0.92|112|G8III
her-the||θ|17.9379|37.2506|3.86|1.42|700|K1II
her-iot||ι|17.6584|46.0063|3.80|-0.18|495|B3IV
her-mu||μ|17.7746|27.7205|3.42|0.75|27|G5IV
her-pi||π|17.2505|36.8092|3.16|1.44|367|K3II
her-xi||ξ|17.9625|29.2478|3.70|0.94|135|G8III
her-omi||ο|18.1257|28.7625|3.83|-0.03|346|B9V
her-tau||τ|16.3283|46.3132|3.89|-0.15|318|B5IV
her-sig||σ|16.5679|42.4370|4.20|-0.02|320|B9V
crb-alp|Alphecca|α|15.5781|26.7147|2.22|-0.02|75|A0V
crb-bet|Nusakan|β|15.4638|29.1058|3.66|0.28|114|F0V
crb-gam||γ|15.7118|26.2965|3.84|0.02|145|A1V
crb-del||δ|15.8271|26.0682|4.63|0.80|165|G5III
crb-eps||ε|15.9601|26.8776|4.15|1.23|230|K2III
crb-the||θ|15.5488|31.3593|4.14|-0.13|310|B6V
crb-iot||ι|15.9148|29.8511|4.99|0.05|330|A0V
boo-alp|Arcturus|α|14.2610|19.1824|-0.05|1.23|37|K1.5III
boo-bet|Nekkar|β|15.0324|40.3906|3.49|0.97|225|G8III
boo-gam|Seginus|γ|14.5348|38.3082|3.03|0.19|85|A7III
boo-del||δ|15.2582|33.3148|3.47|0.95|117|G8III
boo-eps|Izar|ε|14.7498|27.0742|2.37|0.97|203|K0II
boo-zet||ζ|14.6851|13.7283|3.78|0.05|180|A3IV
boo-eta|Muphrid|η|13.9115|18.3977|2.68|0.58|37|G0IV
boo-rho||ρ|14.5303|30.3713|3.58|1.30|149|K3III
boo-the||θ|14.4142|51.8510|4.05|0.50|47|F7V
boo-lam||λ|14.2721|46.0883|4.18|0.08|99|A0V
vir-alp|Spica|α|13.4199|-11.1613|0.98|-0.24|250|B1V
vir-bet|Zavijava|β|11.8447|1.7646|3.59|0.52|36|F9V
vir-gam|Porrima|γ|12.6943|-1.4494|2.74|0.36|38|F0V
vir-del|Auva|δ|12.9266|3.3975|3.38|1.57|198|M3III
vir-eps|Vindemiatrix|ε|13.0362|10.9591|2.83|0.94|110|G8III
vir-zet|Heze|ζ|13.5785|-0.5958|3.38|0.11|74|A3V
vir-eta|Zaniah|η|12.3325|-0.6670|3.89|0.02|250|A2V
vir-iot|Syrma|ι|14.2667|-6.0006|4.08|0.51|70|F6III
vir-mu||μ|14.7180|-5.6581|3.87|0.38|60|F2III
leo-alp|Regulus|α|10.1395|11.9672|1.35|-0.11|79|B8IV
leo-bet|Denebola|β|11.8177|14.5720|2.14|0.09|36|A3V
leo-gam|Algieba|γ|10.3329|19.8415|2.08|1.13|130|K0III
leo-del|Zosma|δ|11.2351|20.5237|2.56|0.13|58|A4V
leo-eps|Algenubi|ε|9.7638|23.7743|2.98|0.80|247|G1II
leo-zet|Adhafera|ζ|10.2782|23.4173|3.44|0.31|274|F0III
leo-eta||η|10.1222|16.7627|3.51|-0.03|1270|A0Ib
leo-the|Chertan|θ|11.2372|15.4298|3.33|-0.01|165|A2V
leo-mu|Rasalas|μ|9.8797|26.0068|3.88|1.22|133|K2III
leo-iot||ι|11.3992|10.5297|3.94|0.41|79|F2IV
leo-sig||σ|11.3521|6.0298|4.05|-0.06|214|B9V
leo-lam|Alterf|λ|9.5288|22.9680|4.31|1.54|336|K5III
gem-alp|Castor|α|7.5767|31.8883|1.58|0.03|51|A1V
gem-bet|Pollux|β|7.7553|28.0262|1.14|1.00|34|K0III
gem-gam|Alhena|γ|6.6285|16.3993|1.93|0.00|109|A0IV
gem-del|Wasat|δ|7.3353|21.9823|3.53|0.37|60|F2IV
gem-eps|Mebsuta|ε|6.7323|25.1311|2.98|1.40|840|G8Ib
gem-zet|Mekbuda|ζ|7.0685|20.5702|3.79|0.79|1200|G0Ib
gem-eta|Propus|η|6.2483|22.5064|3.28|1.60|349|M3III
gem-mu|Tejat|μ|6.3828|22.5137|2.87|1.64|230|M3III
gem-xi|Alzirr|ξ|6.7548|12.8956|3.36|0.44|59|F5IV
gem-kap||κ|7.7404|24.3981|3.57|0.93|143|G8III
gem-iot||ι|7.4288|27.7981|3.79|1.03|121|K0III
gem-tau||τ|7.1855|30.2452|4.41|1.26|321|K2III
gem-ups||υ|7.5983|26.8958|4.06|1.54|250|M0III
gem-lam||λ|7.3010|16.5405|3.58|0.11|94|A3V
ori-alp|Betelgeuse|α|5.9195|7.4070|0.50|1.85|548|M1Ia
ori-bet|Rigel|β|5.2423|-8.2017|0.13|-0.03|863|B8Ia
ori-gam|Bellatrix|γ|5.4189|6.3497|1.64|-0.22|250|B2III
ori-del|Mintaka|δ|5.5334|-0.2991|2.23|-0.18|1200|O9II
ori-eps|Alnilam|ε|5.6036|-1.2019|1.69|-0.18|2000|B0Ia
ori-zet|Alnitak|ζ|5.6793|-1.9426|1.77|-0.20|1260|O9Ib
ori-kap|Saiph|κ|5.7959|-9.6696|2.06|-0.17|650|B0Ia
ori-lam|Meissa|λ|5.5855|9.9342|3.39|-0.16|1100|O8III
ori-eta||η|5.4076|-2.3973|3.36|-0.17|900|B1V
ori-iot|Hatysa|ι|5.5903|-5.9099|2.77|-0.21|1330|O9III
ori-pi3|Tabit|π³|4.8307|6.9612|3.19|0.45|26|F6V
ori-pi4||π⁴|4.8531|5.6051|3.69|-0.17|1100|B2III
ori-pi5||π⁵|4.9040|2.4407|3.72|-0.18|1340|B2III
ori-pi2||π²|4.8434|8.9003|4.35|0.01|194|A1V
ori-pi1||π¹|4.9153|10.1508|4.65|0.08|120|A0V
ori-pi6||π⁶|4.9752|1.7143|4.47|1.40|954|K2II
tau-alp|Aldebaran|α|4.5987|16.5093|0.85|1.54|65|K5III
tau-bet|Elnath|β|5.4382|28.6075|1.65|-0.13|134|B7III
tau-eta|Alcyone|η|3.7914|24.1051|2.87|-0.09|440|B7III
tau-zet||ζ|5.6274|21.1426|3.00|-0.19|417|B4III
tau-the|Chamukuy|θ|4.4785|15.8707|3.40|0.18|155|A7III
tau-gam|Prima Hyadum|γ|4.3299|15.6276|3.65|0.98|154|G8III
tau-del||δ|4.3820|17.5425|3.76|0.98|153|G8III
tau-eps|Ain|ε|4.4766|19.1804|3.53|1.01|155|G9III
tau-lam||λ|4.0114|12.4903|3.47|-0.12|480|B3V
tau-omi||ο|3.4478|9.0292|3.60|0.89|212|G6III
tau-xi||ξ|3.4530|9.7328|3.74|-0.08|222|B9V
tau-kap||κ|4.4256|22.2939|4.21|0.14|153|A7IV
cma-alp|Sirius|α|6.7525|-16.7161|-1.46|0.00|8.6|A1V
cma-bet|Mirzam|β|6.3783|-17.9559|1.98|-0.24|500|B1II
cma-gam|Muliphein|γ|7.0640|-15.6333|4.11|-0.11|402|B8II
cma-del|Wezen|δ|7.1399|-26.3932|1.83|0.67|1600|F8Ia
cma-eps|Adhara|ε|6.9770|-28.9721|1.50|-0.21|430|B2II
cma-zet|Furud|ζ|6.3386|-30.0634|3.02|-0.19|336|B2III
cma-eta|Aludra|η|7.4016|-29.3031|2.45|-0.08|2000|B5Ia
cma-omi2||ο²|7.0500|-23.8333|3.02|-0.08|2600|B3Ia
cma-sig||σ|7.0287|-27.9356|3.47|1.73|1200|K4III
cma-iot||ι|6.9357|-17.0540|4.37|-0.06|3000|B3II
cmi-alp|Procyon|α|7.6550|5.2250|0.38|0.42|11.5|F5IV
cmi-bet|Gomeisa|β|7.4527|8.2893|2.89|-0.09|160|B8V
aur-alp|Capella|α|5.2782|45.9980|0.08|0.80|43|G8III
aur-bet|Menkalinan|β|5.9922|44.9474|1.90|0.08|81|A2IV
aur-the||θ|5.9953|37.2127|2.62|-0.08|173|A0V
aur-iot|Hassaleh|ι|4.9497|33.1661|2.69|1.53|490|K3II
aur-eps|Almaaz|ε|5.0328|43.8233|3.03|0.54|2000|F0Ia
aur-eta|Haedus|η|5.1082|41.2342|3.17|-0.15|219|B3V
aur-zet|Saclateni|ζ|5.0421|41.0758|3.75|1.15|790|K4II
per-alp|Mirfak|α|3.4054|49.8612|1.79|0.48|510|F5Ib
per-bet|Algol|β|3.1361|40.9556|2.12|-0.05|93|B8V
per-gam||γ|3.0800|53.5065|2.93|0.70|243|G8III
per-del||δ|3.7153|47.7876|3.01|-0.13|520|B5III
per-eps||ε|3.9643|40.0104|2.89|-0.19|540|B0V
per-zet||ζ|3.9021|31.8836|2.85|0.26|750|B1Ib
per-eta||η|2.8450|55.8953|3.76|1.69|1331|K3Ib
per-rho|Gorgonea Tertia|ρ|3.0857|38.8402|3.39|1.65|325|M4II
per-the||θ|2.7371|49.2284|4.10|0.49|37|F7V
and-alp|Alpheratz|α|0.1398|29.0906|2.06|-0.11|97|B8IV
and-bet|Mirach|β|1.1622|35.6206|2.06|1.58|197|M0III
and-gam|Almach|γ|2.0650|42.3297|2.10|1.37|350|K3II
and-del||δ|0.6553|30.8612|3.27|1.28|101|K3III
and-mu||μ|0.9463|38.4993|3.86|0.13|136|A5V
and-nu||ν|0.8306|41.0794|4.53|-0.15|680|B5V
peg-alp|Markab|α|23.0793|15.2053|2.49|-0.04|133|B9III
peg-bet|Scheat|β|23.0629|28.0828|2.42|1.67|196|M2II
peg-gam|Algenib|γ|0.2206|15.1836|2.83|-0.19|390|B2IV
peg-eps|Enif|ε|21.7364|9.8750|2.39|1.53|690|K2Ib
peg-zet|Homam|ζ|22.6910|10.8314|3.40|-0.09|209|B8V
peg-eta|Matar|η|22.7169|30.2211|2.94|0.86|215|G2II
peg-the|Biham|θ|22.1699|6.1978|3.53|0.09|97|A2V
peg-mu|Sadalbari|μ|22.8330|24.6017|3.48|0.93|106|G8III
peg-iot||ι|22.1170|25.3450|3.76|0.44|38|F5V
ari-alp|Hamal|α|2.1195|23.4624|2.00|1.15|66|K2III
ari-bet|Sheratan|β|1.9105|20.8081|2.64|0.13|60|A5V
ari-gam|Mesarthim|γ|1.8925|19.2939|3.88|0.02|164|B9V
ari-del||δ|3.2010|19.7268|4.35|1.03|168|K2III
tri-alp|Mothallah|α|1.8847|29.5790|3.41|0.49|64|F6IV
tri-bet||β|2.1592|34.9872|3.00|0.14|127|A5III
tri-gam||γ|2.2885|33.8473|4.01|0.02|118|A1V
psc-eta|Alpherg|η|1.5249|15.3461|3.62|0.97|350|G7III
psc-gam||γ|23.2860|3.2823|3.69|0.92|138|G7III
psc-alp|Alrescha|α|2.0331|2.7638|3.82|0.03|139|A0V
psc-ome||ω|23.9884|6.8633|4.03|0.42|106|F4IV
psc-iot||ι|23.6655|5.6275|4.13|0.51|45|F7V
psc-eps||ε|1.0479|7.8900|4.27|0.96|190|K0III
psc-del||δ|0.8113|7.5850|4.43|1.50|305|K5III
psc-bet||β|23.0396|3.8203|4.48|-0.12|492|B6V
psc-the||θ|23.4649|6.3794|4.27|1.07|159|K1III
psc-lam||λ|23.7115|1.7803|4.49|0.20|100|A7V
psc-kap||κ|23.4468|1.2556|4.94|0.06|163|A0V
cet-alp|Menkar|α|3.0380|4.0897|2.53|1.64|249|M1III
cet-bet|Diphda|β|0.7264|-17.9866|2.04|1.02|96|K0III
cet-gam|Kaffaljidhma|γ|2.7217|3.2358|3.47|0.09|82|A3V
cet-del||δ|2.6564|0.3285|4.07|-0.22|590|B2IV
cet-omi|Mira|ο|2.3224|-2.9776|3.50|1.42|300|M7III
cet-zet|Baten Kaitos|ζ|1.8577|-10.3350|3.73|1.14|235|K0III
cet-tau||τ|1.7345|-15.9375|3.49|0.72|11.9|G8V
cet-eta|Deneb Algenubi|η|1.1429|-10.1820|3.45|1.16|123|K2III
cet-iot|Deneb Kaitos Shemali|ι|0.3234|-8.8235|3.56|1.21|290|K2III
cet-the||θ|1.4001|-8.1834|3.60|1.06|114|K0III
cet-ups||υ|2.0033|-21.0779|3.99|1.57|293|M0III
aqr-alp|Sadalmelik|α|22.0964|-0.3199|2.95|0.98|520|G2Ib
aqr-bet|Sadalsuud|β|21.5258|-5.5712|2.90|0.83|540|G0Ib
aqr-gam|Sadachbia|γ|22.3603|-1.3871|3.84|-0.05|164|A0V
aqr-del|Skat|δ|22.9109|-15.8208|3.27|0.05|160|A3V
aqr-zet|Sadaltager|ζ|22.4806|-0.0201|3.65|0.40|92|F3V
aqr-eps|Albali|ε|20.7944|-9.4958|3.77|0.00|229|A1V
aqr-lam||λ|22.8770|-7.5797|3.73|1.64|392|M2III
aqr-eta||η|22.5903|-0.1173|4.02|-0.09|184|B9V
aqr-phi||φ|23.2288|-6.0490|4.22|1.56|223|M2III
cap-alp|Algedi|α|20.3002|-12.5083|3.57|0.89|109|G3III
cap-bet|Dabih|β|20.3501|-14.7814|3.05|0.79|328|G9II
cap-gam|Nashira|γ|21.6680|-16.6623|3.68|0.32|139|A7III
cap-del|Deneb Algedi|δ|21.7840|-16.1273|2.85|0.29|39|A7III
cap-zet||ζ|21.4447|-22.4113|3.74|1.00|398|G4Ib
cap-the||θ|21.0983|-17.2328|4.07|0.01|158|A1V
cap-ome||ω|20.8633|-26.9192|4.11|1.66|630|M0III
cap-psi||ψ|20.7686|-25.2705|4.13|0.42|48|F5V
sgr-eps|Kaus Australis|ε|18.4029|-34.3846|1.85|-0.03|143|B9II
sgr-sig|Nunki|σ|18.9210|-26.2967|2.05|-0.22|228|B2V
sgr-del|Kaus Media|δ|18.3499|-29.8281|2.70|1.38|348|K3III
sgr-lam|Kaus Borealis|λ|18.4659|-25.4217|2.81|1.04|78|K1III
sgr-zet|Ascella|ζ|19.0432|-29.8803|2.60|0.08|88|A2IV
sgr-phi||φ|18.7610|-26.9907|3.17|-0.11|231|B8III
sgr-tau||τ|19.1151|-27.6702|3.32|1.19|122|K1III
sgr-gam|Alnasl|γ|18.0966|-30.4241|2.98|1.00|96|K0III
sgr-pi|Albaldah|π|19.1626|-21.0235|2.88|0.36|510|F2II
sgr-eta||η|18.2935|-36.7615|3.11|1.56|149|M3II
sgr-xi||ξ|18.9564|-21.1067|3.51|1.18|372|K1III
sgr-omi||ο|19.0774|-21.7416|3.77|1.02|140|K0III
sco-alp|Antares|α|16.4901|-26.4320|1.09|1.83|554|M1Ib
sco-bet|Acrab|β|16.0906|-19.8054|2.62|-0.07|400|B1V
sco-del|Dschubba|δ|16.0055|-22.6217|2.32|-0.12|490|B0IV
sco-pi||π|15.9810|-26.1141|2.89|-0.19|590|B1V
sco-sig|Alniyat|σ|16.3535|-25.5928|2.89|0.13|735|B1III
sco-tau|Paikauhale|τ|16.5981|-28.2160|2.82|-0.25|470|B0V
sco-eps|Larawag|ε|16.8360|-34.2933|2.29|1.14|65|K1III
sco-mu1|Xamidimura|μ|16.8654|-38.0475|3.00|-0.20|500|B1V
sco-zet2|Fang|ζ|16.9100|-42.3620|3.62|1.40|132|K4III
sco-eta||η|17.2031|-43.2392|3.33|0.41|72|F3V
sco-the|Sargas|θ|17.6222|-42.9978|1.86|0.40|300|F1II
sco-iot||ι|17.7931|-40.1270|3.03|0.51|1800|F2Ia
sco-kap|Girtab|κ|17.7083|-39.0300|2.41|-0.19|480|B1V
sco-lam|Shaula|λ|17.5601|-37.1038|1.62|-0.23|570|B2IV
sco-ups|Lesath|υ|17.5127|-37.2958|2.69|-0.22|580|B2IV
lib-alp|Zubenelgenubi|α|14.8479|-16.0418|2.75|0.15|77|A3V
lib-bet|Zubeneschamali|β|15.2833|-9.3829|2.61|-0.11|185|B8V
lib-gam|Zubenelhakrabi|γ|15.5917|-14.7894|3.91|1.01|152|G8III
lib-sig|Brachium|σ|15.0677|-25.2819|3.29|1.70|292|M3III
oph-alp|Rasalhague|α|17.5822|12.5600|2.08|0.16|49|A5III
oph-bet|Cebalrai|β|17.7248|4.5673|2.76|1.16|82|K2III
oph-del|Yed Prior|δ|16.2391|-3.6942|2.73|1.58|171|M0III
oph-eps|Yed Posterior|ε|16.3043|-4.6926|3.23|0.96|107|G9III
oph-zet||ζ|16.6194|-10.5671|2.56|0.02|366|O9V
oph-eta|Sabik|η|17.1729|-15.7250|2.43|0.06|84|A2V
oph-kap||κ|16.9612|9.3750|3.19|1.16|86|K2III
oph-lam|Marfik|λ|16.5152|1.9838|3.82|0.02|170|A1V
oph-nu||ν|17.9841|-9.7735|3.34|0.99|153|K0III
oph-the||θ|17.3676|-24.9995|3.27|-0.22|436|B2IV
ser-alp|Unukalhai|α|15.7378|6.4256|2.63|1.17|74|K2III
ser-bet||β|15.7697|15.4220|3.65|0.06|155|A3V
ser-mu||μ|15.8271|-3.4301|3.53|-0.04|156|A0V
ser-eps||ε|15.8467|4.4776|3.71|0.32|70|A2V
ser-del||δ|15.5800|10.5390|3.80|0.27|210|F0IV
ser-gam||γ|15.9410|15.6618|3.85|0.48|36|F6V
ser-eta||η|18.3552|-2.8990|3.26|0.94|62|K0III
ser-xi||ξ|17.6266|-15.3986|3.54|0.30|105|F0III
ser-omi||ο|17.6904|-12.8747|4.26|0.10|166|A2V
ser-nu||ν|17.3474|-12.8459|4.33|0.03|194|A0V
sct-alp||α|18.5866|-8.2442|3.85|1.33|199|K3III
sct-bet||β|18.7869|-4.7478|4.22|1.10|900|G4II
sge-gam||γ|19.9790|19.4922|3.47|1.57|274|K5III
sge-del||δ|19.7898|18.5341|3.82|1.40|448|M2II
sge-alp|Sham|α|19.6684|18.0139|4.37|0.78|473|G1II
sge-bet||β|19.6829|17.4761|4.37|0.93|420|G8II
del-alp|Sualocin|α|20.6605|15.9120|3.77|-0.06|241|B9V
del-bet|Rotanev|β|20.6255|14.5953|3.63|0.44|97|F5IV
del-gam||γ|20.7772|16.1243|4.27|0.44|101|F7V
del-del||δ|20.7255|15.0747|4.43|0.31|203|A7III
del-eps|Deneb Dulfim|ε|20.5533|11.3033|4.03|-0.09|359|B6III
lac-alp||α|22.5211|50.2825|3.77|0.01|102|A1V
lac-bet||β|22.3854|52.2291|4.42|1.02|170|G9III
vul-alp||α|19.4786|24.6650|4.44|1.50|297|M0III
cvn-alp|Cor Caroli|α|12.9339|38.3187|2.89|-0.11|110|A0V
cvn-bet|Chara|β|12.5623|41.3576|4.24|0.58|27|G0V
com-bet||β|13.1979|27.8781|4.26|0.57|30|G0V
com-alp|Diadem|α|13.1663|17.5292|4.32|0.44|63|F5V
com-gam||γ|12.4479|28.2682|4.35|1.13|170|K1III
lyn-alp||α|9.3509|34.3925|3.13|1.55|203|K7III
lyn-38||38|9.3127|36.8026|3.82|0.11|122|A3V
cnc-bet|Altarf|β|8.2752|9.1856|3.52|1.48|290|K4III
cnc-del|Asellus Australis|δ|8.7449|18.1543|3.94|1.08|180|K0III
cnc-gam|Asellus Borealis|γ|8.7214|21.4686|4.66|0.01|181|A1IV
cnc-alp|Acubens|α|8.9747|11.8577|4.25|0.14|174|A5V
cnc-iot||ι|8.7784|28.7600|4.02|1.01|298|G8II
hya-alp|Alphard|α|9.4597|-8.6586|1.98|1.44|177|K3II
hya-gam||γ|13.3151|-23.1716|2.99|0.92|134|G8III
hya-zet||ζ|8.9231|5.9455|3.11|1.00|151|K0III
hya-nu||ν|10.8265|-16.1936|3.11|1.25|138|K2III
hya-eps||ε|8.7795|6.4189|3.38|0.68|129|G5III
hya-del||δ|8.6278|5.7035|4.14|0.00|179|A1V
hya-sig||σ|8.6455|3.3417|4.44|1.22|359|K1III
hya-eta||η|8.7196|3.3992|4.30|-0.20|590|B3V
hya-the||θ|9.2397|2.3140|3.88|-0.06|129|A0V
hya-iot||ι|9.6652|-1.1428|3.90|1.32|277|K3III
hya-lam||λ|10.1766|-12.3543|3.61|1.01|115|K0III
hya-mu||μ|10.4355|-16.8362|3.81|1.48|249|K4III
hya-pi||π|14.1063|-26.6820|3.25|1.12|101|K2III
hya-bet||β|11.8825|-33.9081|4.28|-0.11|365|B9V
crv-alp|Alchiba|α|12.1398|-24.7289|4.02|0.33|49|F1V
crv-bet|Kraz|β|12.5735|-23.3966|2.65|0.89|146|G5II
crv-gam|Gienah|γ|12.2634|-17.5420|2.59|-0.11|154|B8III
crv-del|Algorab|δ|12.4976|-16.5154|2.95|-0.05|87|B9V
crv-eps|Minkar|ε|12.1684|-22.6198|3.02|1.33|303|K2III
crt-del||δ|11.3222|-14.7790|3.56|1.12|196|K0III
crt-alp|Alkes|α|10.9961|-18.2988|4.07|1.08|174|K1III
crt-gam||γ|11.4146|-17.6842|4.06|0.21|84|A9V
crt-bet||β|11.1946|-22.8260|4.46|0.03|266|A2III
lep-alp|Arneb|α|5.5455|-17.8223|2.58|0.21|2200|F0Ib
lep-bet|Nihal|β|5.4705|-20.7594|2.84|0.82|159|G5II
lep-eps||ε|5.0913|-22.3711|3.19|1.46|213|K4III
lep-mu||μ|5.2131|-16.2054|3.31|-0.11|184|B9IV
lep-zet||ζ|5.7821|-14.8217|3.55|0.10|70|A2V
lep-gam||γ|5.7441|-22.4481|3.59|0.47|29|F6V
lep-del||δ|5.8553|-20.8794|3.81|0.99|112|G8III
col-alp|Phact|α|5.6606|-34.0741|2.65|-0.12|261|B7IV
col-bet|Wazn|β|5.8492|-35.7683|3.12|1.16|87|K1III
col-del||δ|6.3694|-33.4362|3.85|0.88|237|G7II
col-eps||ε|5.5230|-35.4704|3.87|1.14|262|K1III
mon-alp||α|7.6871|-9.5511|3.93|1.02|144|K0III
mon-bet||β|6.4803|-7.0333|3.76|-0.11|690|B3V
mon-gam||γ|6.2477|-6.2747|3.98|1.32|645|K3III
mon-del||δ|7.1970|-0.4931|4.15|0.02|375|A2V
pup-zet|Naos|ζ|8.0597|-40.0031|2.25|-0.27|1080|O4If
pup-pi||π|7.2853|-37.0975|2.71|1.62|810|K3Ib
pup-rho||ρ|8.1258|-24.3044|2.81|0.43|64|F6II
pup-tau||τ|6.8323|-50.6144|2.93|1.20|183|K1III
pup-nu||ν|6.6304|-43.1958|3.17|-0.11|420|B8III
pup-sig||σ|7.4869|-43.3012|3.25|1.51|184|K5III
pup-xi||ξ|7.8203|-24.8595|3.34|1.24|1200|G6Ib
vel-gam|Regor|γ|8.1584|-47.3367|1.78|-0.22|1100|WC8
vel-del|Alsephina|δ|8.7451|-54.7087|1.96|0.04|81|A1V
vel-lam|Suhail|λ|9.1330|-43.4326|2.21|1.66|545|K4Ib
vel-kap|Markeb|κ|9.3680|-55.0107|2.50|-0.18|539|B2IV
vel-mu||μ|10.7803|-49.4203|2.69|0.90|116|G5III
vel-phi||φ|9.9568|-54.5677|3.52|-0.18|1930|B5Ib
vel-psi||ψ|9.5108|-40.4667|3.60|0.36|61|F0IV
car-alp|Canopus|α|6.3992|-52.6957|-0.72|0.15|310|A9II
car-bet|Miaplacidus|β|9.2200|-69.7172|1.68|0.07|113|A2IV
car-eps|Avior|ε|8.3752|-59.5095|1.86|1.20|630|K3III
car-iot|Aspidiske|ι|9.2850|-59.2753|2.21|0.18|690|A9Ib
car-the||θ|10.7153|-64.3945|2.76|-0.22|460|B0V
car-ups||υ|9.7850|-65.0720|2.97|0.28|1600|A7Ib
car-ome||ω|10.2288|-70.0380|3.29|-0.08|370|B8III
car-pp||p|10.5350|-61.6853|3.30|-0.09|470|B4V
car-qq||q|10.2846|-61.3325|3.39|1.54|500|K3III
cru-alp|Acrux|α|12.4433|-63.0991|0.77|-0.24|320|B0IV
cru-bet|Mimosa|β|12.7953|-59.6888|1.25|-0.24|280|B0IV
cru-gam|Gacrux|γ|12.5194|-57.1133|1.63|1.59|89|M3III
cru-del||δ|12.2525|-58.7489|2.79|-0.19|345|B2IV
cru-eps||ε|12.3564|-60.4012|3.59|1.42|228|K3III
cen-alp|Rigil Kentaurus|α|14.6601|-60.8354|-0.27|0.71|4.4|G2V
cen-bet|Hadar|β|14.0637|-60.3730|0.61|-0.23|390|B1III
cen-gam|Muhlifain|γ|12.6919|-48.9599|2.17|-0.01|130|A1IV
cen-del||δ|12.1398|-50.7226|2.58|-0.12|410|B2IV
cen-eps||ε|13.6648|-53.4664|2.30|-0.22|430|B1III
cen-zet||ζ|13.9257|-47.2882|2.55|-0.22|385|B2IV
cen-eta||η|14.5918|-42.1580|2.31|-0.19|308|B1V
cen-the|Menkent|θ|14.1115|-36.3700|2.06|1.01|59|K0III
cen-iot||ι|13.3437|-36.7123|2.75|0.06|59|A2V
cen-kap||κ|14.9598|-42.1042|3.13|-0.21|540|B2IV
cen-lam||λ|11.5961|-63.0194|3.11|-0.05|410|B9III
cen-mu||μ|13.8259|-42.4737|3.04|-0.17|520|B2IV
cen-nu||ν|13.8287|-41.6879|3.41|-0.22|475|B2IV
lup-alp||α|14.6989|-47.3882|2.30|-0.20|550|B1III
lup-bet||β|14.9754|-43.1339|2.68|-0.20|525|B2III
lup-gam||γ|15.5851|-41.1667|2.78|-0.19|570|B2IV
lup-del||δ|15.3563|-40.6475|3.22|-0.21|900|B1V
lup-eps||ε|15.3781|-44.6896|3.37|-0.19|500|B2IV
lup-zet||ζ|15.2126|-52.0991|3.41|0.92|117|G8III
ara-alp||α|17.5309|-49.8761|2.95|-0.17|270|B2V
ara-bet||β|17.4219|-55.5299|2.85|1.46|600|K3Ib
ara-gam||γ|17.4190|-56.3777|3.34|-0.13|1140|B1Ib
ara-zet||ζ|16.9772|-55.9902|3.13|1.60|574|K3III
ara-del||δ|17.5186|-60.6836|3.62|-0.10|187|B8V
tra-alp|Atria|α|16.8111|-69.0277|1.91|1.44|391|K2Ib
tra-bet||β|15.9192|-63.4306|2.85|0.29|40|F2III
tra-gam||γ|15.3153|-68.6794|2.89|0.01|184|A1V
pav-alp|Peacock|α|20.4275|-56.7351|1.94|-0.12|179|B2IV
pav-bet||β|20.7497|-66.2032|3.42|0.16|137|A7III
pav-del||δ|20.1455|-66.1820|3.56|0.75|20|G8IV
gru-alp|Alnair|α|22.1372|-46.9610|1.74|-0.07|101|B6V
gru-bet|Tiaki|β|22.7111|-46.8846|2.12|1.60|177|M5III
gru-gam|Aldhanab|γ|21.8986|-37.3648|3.00|-0.12|211|B8III
gru-eps||ε|22.8095|-51.3169|3.49|0.08|130|A2V
gru-del||δ|22.4869|-43.4958|3.97|1.02|309|G7III
phe-alp|Ankaa|α|0.4381|-42.3061|2.39|1.09|85|K0III
phe-bet||β|1.1011|-46.7185|3.31|0.89|198|G8III
phe-gam||γ|1.4723|-43.3182|3.41|1.57|234|K5III
tuc-alp||α|22.3084|-60.2597|2.87|1.39|199|K3III
hyi-alp||α|1.9800|-61.5700|2.86|0.28|71|F0V
hyi-bet||β|0.4297|-77.2543|2.80|0.62|24|G2IV
eri-alp|Achernar|α|1.6286|-57.2367|0.46|-0.16|139|B6V
eri-bet|Cursa|β|5.1305|-5.0864|2.79|0.13|89|A3III
eri-the|Acamar|θ|2.9710|-40.3047|2.91|0.13|161|A4III
eri-gam|Zaurak|γ|3.9678|-13.5086|2.95|1.59|203|M1III
eri-del|Rana|δ|3.7208|-9.7653|3.54|0.92|29|K0IV
eri-eps||ε|3.5475|-9.4583|3.73|0.88|10.5|K2V
eri-eta|Azha|η|2.9510|-8.8981|3.89|1.11|137|K1III
eri-tau4||τ⁴|3.3266|-21.7579|3.69|1.62|300|M3III
eri-ups4||υ⁴|4.3993|-33.7983|3.56|-0.11|180|B9V
eri-phi||φ|2.2777|-51.5121|3.56|-0.12|155|B8V
eri-chi||χ|1.9558|-51.6089|3.69|0.84|57|G8IV
eri-kap||κ|2.7000|-47.7042|4.25|-0.14|540|B5IV
eri-iot||ι|2.6785|-39.8551|4.11|1.02|140|K0III
psa-alp|Fomalhaut|α|22.9608|-29.6222|1.16|0.09|25|A3V
psa-eps||ε|22.6779|-27.0437|4.17|-0.10|750|B8V
oct-sig||σ|21.1470|-88.9565|5.45|0.27|294|F0III
cam-bet||β|5.0570|60.4422|4.03|0.92|1000|G0Ib
cam-alp||α|4.9007|66.3426|4.29|0.03|6000|O9Ia
ant-alp||α|10.4527|-31.0678|4.25|1.45|320|K4III
ant-eps||ε|9.4873|-35.9513|4.51|1.44|700|K3III
ant-iot||ι|10.9453|-37.1378|4.60|1.03|200|K0III
aps-alp||α|14.7977|-79.0448|3.83|1.43|447|K3III
aps-del||δ|16.3383|-78.6957|4.68|1.69|760|M4III
aps-gam||γ|16.5576|-78.8971|3.89|0.91|160|G9III
aps-bet||β|16.7181|-77.5174|4.24|1.06|158|K0III
cae-alp||α|4.6760|-41.8638|4.45|0.34|66|F2V
cae-bet||β|4.7010|-37.1446|5.05|0.37|93|F3V
cae-gam||γ|5.0736|-35.4829|4.55|1.33|185|K3III
cha-alp||α|8.3088|-76.9197|4.06|0.39|64|F5III
cha-gam||γ|10.5911|-78.6078|4.11|1.58|418|M0III
cha-del||δ|10.7629|-80.5402|4.45|-0.12|364|B2V
cha-bet||β|12.3057|-79.3122|4.24|-0.12|270|B4V
cir-alp||α|14.7085|-64.9751|3.19|0.26|54|A7V
cir-bet||β|15.2924|-58.8012|4.07|0.09|100|A3V
cir-gam||γ|15.3894|-59.3208|4.48|0.18|450|B5IV
cra-eps||ε|18.9786|-37.1074|4.83|0.39|98|F4V
cra-gam||γ|19.1066|-37.0634|4.23|0.52|56|F8V
cra-alp|Meridiana|α|19.1579|-37.9045|4.10|0.04|125|A2V
cra-bet||β|19.1673|-39.3408|4.11|1.20|474|K0II
cra-del||δ|19.1389|-40.4967|4.59|1.08|178|K1III
cra-zet||ζ|19.0517|-42.0951|4.75|-0.02|221|B9V
cra-the||θ|18.5570|-42.3125|4.62|1.00|900|G8III
dor-gam||γ|4.2669|-51.4866|4.25|0.31|66|F1V
dor-alp||α|4.5667|-55.0450|3.27|-0.10|169|A0III
dor-zet||ζ|5.0916|-57.4727|4.72|0.53|38|F9V
dor-bet||β|5.5605|-62.4898|3.76|0.82|1050|F6Ia
dor-del||δ|5.7463|-65.7355|4.35|0.22|148|A7V
equ-gam||γ|21.1720|10.1316|4.69|0.26|118|A9V
equ-del||δ|21.2411|10.0070|4.47|0.50|60|F8V
equ-alp|Kitalpha|α|21.2637|5.2479|3.92|0.53|190|G0III
equ-bet||β|21.3820|6.8111|5.16|0.01|360|A3V
for-nu||ν|2.0746|-29.2968|4.69|-0.17|370|B9III
for-bet||β|2.8182|-32.4059|4.46|0.99|169|G8III
for-alp|Dalim|α|3.2012|-28.9876|3.87|0.52|46|F8IV
hor-alp||α|4.2334|-42.2944|3.85|1.10|115|K1III
hor-eta||η|2.5422|-52.5431|5.31|0.30|219|A6V
hor-zet||ζ|2.6780|-54.5500|5.21|0.40|160|F4IV
hor-mu||μ|3.0610|-59.7378|5.11|0.34|134|F0IV
hor-bet||β|2.9800|-64.0713|4.98|0.12|310|A5III
ind-alp||α|20.6261|-47.2915|3.11|1.00|98|K0III
ind-the||θ|21.3313|-53.4494|4.39|0.19|97|A5V
ind-bet||β|20.9135|-58.4541|3.65|1.25|600|K1II
ind-del||δ|21.9651|-54.9926|4.40|0.28|185|F0IV
lmi-10||10|9.5703|36.3976|4.55|0.92|185|G8III
lmi-21||21|10.1233|35.2447|4.48|0.18|92|A7V
lmi-bet||β|10.4648|36.7072|4.21|0.90|154|G9III
lmi-46|Praecipua|46|10.8885|34.2150|3.83|1.04|95|K0III
men-bet||β|5.0449|-71.3143|5.31|0.95|650|G8III
men-gam||γ|5.5313|-76.3410|5.18|1.13|100|K2III
men-alp||α|6.1706|-74.7530|5.09|0.72|33|G7V
mic-alp||α|20.8334|-33.7797|4.90|1.00|380|G7III
mic-gam||γ|21.0213|-32.2578|4.67|0.89|223|G6III
mic-eps||ε|21.2988|-32.1725|4.71|0.03|180|A1V
mus-lam||λ|11.7601|-66.7288|3.64|0.16|128|A7IV
mus-eps||ε|12.2929|-67.9607|4.11|1.58|300|M5III
mus-alp||α|12.6197|-69.1356|2.69|-0.20|315|B2IV
mus-bet||β|12.7717|-68.1081|3.05|-0.18|340|B2V
mus-gam||γ|12.5411|-72.1330|3.84|-0.15|325|B5V
mus-del||δ|13.0378|-71.5489|3.62|1.18|91|K2III
nor-del||δ|16.1082|-45.1731|4.72|0.23|123|A3IV
nor-eta||η|16.0534|-49.2297|4.65|0.96|218|G8III
nor-gam||γ|16.3301|-50.1555|4.02|1.08|129|G8III
nor-eps||ε|16.4531|-47.5546|4.47|-0.07|530|B4V
pic-bet||β|5.7881|-51.0665|3.86|0.17|63|A6V
pic-gam||γ|5.8303|-56.1666|4.51|1.10|174|K1III
pic-alp||α|6.8030|-61.9414|3.27|0.21|97|A7IV
pyx-bet||β|8.6684|-35.3084|3.97|0.94|420|G7Ib
pyx-alp||α|8.7266|-33.1864|3.68|-0.18|880|B1.5III
pyx-gam||γ|8.8422|-27.7098|4.01|1.27|209|K3III
ret-bet||β|3.7367|-64.8069|3.84|1.13|98|K2III
ret-del||δ|3.9794|-61.4002|4.56|1.62|530|M1III
ret-eps||ε|4.2753|-59.3020|4.44|1.08|59|K2IV
ret-alp||α|4.2402|-62.4739|3.35|0.91|163|G8III
scl-alp||α|0.9767|-29.3574|4.30|-0.16|780|B7III
scl-del||δ|23.8155|-28.1303|4.57|0.01|137|A0V
scl-gam||γ|23.3137|-32.5320|4.41|1.13|182|K1III
scl-bet||β|23.5493|-37.8184|4.37|-0.10|174|B9IV
sex-gam||γ|9.8752|-8.1050|5.05|0.03|262|A1V
sex-alp||α|10.1323|-0.3716|4.48|-0.04|280|A0III
sex-bet||β|10.5043|-0.6370|5.09|-0.14|345|B6V
tel-eps||ε|18.1870|-45.9544|4.52|1.01|417|K0III
tel-alp||α|18.4496|-45.9685|3.49|-0.17|278|B3IV
tel-zet||ζ|18.4807|-49.0706|4.10|1.02|127|K1III
vol-gam||γ|7.1452|-70.4989|3.78|1.04|142|K0III
vol-del||δ|7.2807|-67.9572|3.98|0.79|740|F9Ib
vol-eps||ε|8.1320|-68.6171|4.35|-0.11|640|B6IV
vol-zet||ζ|8.6618|-72.6027|3.95|1.04|138|K0III
vol-alp||α|9.0408|-66.3961|4.00|0.14|124|A5V
vol-bet||β|8.4289|-66.1369|3.77|1.13|108|K1III
cam-gam||γ|3.8394|71.3323|4.63|0.03|330|A2IV
hyi-gam||γ|3.7872|-74.2390|3.24|1.62|214|M2III
lac-1||1|22.2663|37.7487|4.13|1.47|620|K3II
lac-5||5|22.4921|47.7069|4.36|1.68|1190|M0II
lac-4||4|22.4085|49.4764|4.55|0.09|2000|B9Iab
oct-nu||ν|21.6913|-77.3900|3.76|1.00|63|K1III
oct-bet||β|22.7677|-81.3816|4.13|0.20|140|A9IV
oct-del||δ|14.4487|-83.6679|4.31|1.31|300|K2III
sct-gam||γ|18.4866|-14.5658|4.70|0.06|320|A1IV
sct-del||δ|18.7043|-9.0525|4.72|0.35|202|F2III
tuc-gam||γ|23.2905|-58.2357|3.99|0.40|75|F3IV
tuc-zet||ζ|0.3350|-64.8748|4.23|0.58|28|F9V
tuc-bet||β|0.5256|-62.9582|4.37|-0.06|140|B9V
vul-13||13|19.8918|24.0796|4.57|-0.06|340|B9III
vul-15||15|20.0186|27.7536|4.64|0.18|230|A7III
uma-23||23|9.5255|63.0619|3.67|0.33|77|F0IV
boo-mu|Alkalurops|μ|15.4082|37.3771|4.31|0.31|121|F0IV
cyg-nu||ν|20.9530|41.1671|3.94|0.02|370|A0III
cyg-xi||ξ|21.0823|43.9278|3.72|1.65|1200|K4Ib
cyg-tau||τ|21.2482|38.0453|3.72|0.39|68|F2IV
cyg-omi|Azelfafage|ο|20.2273|46.7414|3.80|1.21|800|K2II
aqr-tau||τ|22.8267|-13.5925|4.05|1.60|320|M0III
aqr-iot||ι|22.1072|-13.8697|4.27|-0.07|185|B8V
aqr-psi||ψ|23.2651|-9.0877|4.21|1.11|148|K1III
and-iot||ι|23.6353|43.2681|4.29|-0.08|500|B8V
and-kap||κ|23.6734|44.3339|4.14|-0.08|168|B9IV
and-lam||λ|23.6264|46.4582|3.82|1.01|85|G8III
and-omi||ο|23.0321|42.3260|3.62|-0.09|690|B6III
and-pi||π|0.6147|33.7193|4.34|-0.14|600|B5V
and-51|Nembus|51|1.6331|48.6285|3.57|1.28|174|K3III
per-xi|Menkib|ξ|3.9823|35.7910|4.04|0.01|1200|O7.5III
per-omi|Atik|ο|3.7383|32.2882|3.83|0.05|1000|B1III
per-tau||τ|2.9051|52.7625|3.93|0.74|250|G5III
per-iot||ι|3.1515|49.6133|4.05|0.60|34|G0V
per-kap||κ|3.1580|44.8575|3.80|0.98|114|K0III
per-nu||ν|3.7533|42.5785|3.77|0.42|540|F5II
per-mu||μ|4.2482|48.4093|4.14|0.95|900|G0Ib
per-lam||λ|4.1102|50.3513|4.29|-0.01|350|B9V
aur-del||δ|5.9918|54.2847|3.72|1.00|140|K0III
aur-nu||ν|5.8584|39.1485|3.97|1.13|230|K0III
aur-pi||π|5.9985|45.9367|4.25|1.72|830|M3II
ori-sig||σ|5.6453|-2.6000|3.77|-0.24|1260|O9.5V
ori-tau||τ|5.2932|-6.8445|3.60|-0.12|555|B5III
leo-rho||ρ|10.5469|9.3066|3.85|-0.14|5000|B1Ib
leo-omi|Subra|ο|9.6858|9.8923|3.52|0.49|135|F5II
vir-tau||τ|14.0274|1.5445|4.23|0.10|200|A3V
vir-109||109|14.7706|1.8929|3.72|0.00|129|A0V
vir-the||θ|13.1660|-5.5390|4.38|0.00|300|A1IV
vir-kap||κ|14.2150|-10.2737|4.18|1.33|310|K3III
lib-tau||τ|15.6448|-29.7778|3.66|-0.17|445|B2.5V
lib-ups||υ|15.6170|-28.1351|3.58|1.38|195|K3III
lib-the||θ|15.8975|-16.7293|4.13|1.00|163|G8III
oph-gam||γ|17.7982|2.7072|3.75|0.04|95|A0V
sgr-mu|Polis|μ|18.2294|-21.0588|3.85|0.23|3000|B8Ia
sgr-rho||ρ|19.3618|-17.8472|3.92|0.23|122|F0IV
sgr-alp|Rukbat|α|19.3980|-40.6159|3.96|-0.10|182|B8V
sgr-bet|Arkab Prior|β|19.3773|-44.4590|3.96|-0.10|380|B9V
cap-iot||ι|21.3706|-16.8345|4.27|0.90|208|G8III
cet-mu||μ|2.7494|10.1141|4.27|0.31|87|A9III
cet-xi2||ξ²|2.4695|8.4601|4.30|-0.06|192|B9III
cet-pi||π|2.7352|-13.8587|4.24|-0.14|390|B7V
eri-mu||μ|4.7581|-3.2547|4.01|-0.15|520|B5IV
eri-nu||ν|4.6052|-3.3525|3.93|-0.21|540|B2III
cma-omi1||ο¹|6.9018|-24.1842|3.87|1.73|2000|K2Iab
pup-c||c|7.7548|-37.9686|3.62|1.73|1000|K4III
hya-xi||ξ|11.5500|-31.8578|3.54|0.94|130|G7III
cen-psi||ψ|14.1080|-37.8853|4.05|-0.03|250|B9III
cen-phi||φ|13.9716|-42.1008|3.83|-0.21|520|B2IV
cen-ups||υ|13.9776|-44.8036|3.87|-0.18|450|B2IV
cen-tau||τ|12.6279|-48.5413|3.86|0.05|130|A2V
cen-pi||π|11.3502|-54.4910|3.89|-0.15|360|B5V
cen-sig||σ|12.4674|-50.2306|3.91|-0.19|410|B2V
cen-rho||ρ|12.1941|-52.3685|3.96|-0.15|330|B3V
cru-mu||μ|12.9105|-57.1779|4.03|-0.17|370|B2IV
cru-zet||ζ|12.3072|-64.0030|4.04|-0.17|360|B2.5V
`;

/* Constellation figures.  abbr|Genitive-free name|pairs (token = bayer in this constellation, or con.bayer) */
const FIGURE_SRC = `
uma|Ursa Major|The Great Bear|alp-bet,bet-gam,gam-del,del-alp,del-eps,eps-zet,zet-eta,bet-ups,ups-omi,ups-the,the-kap,kap-iot,gam-chi,chi-psi,psi-mu,mu-lam,chi-nu,nu-xi
umi|Ursa Minor|The Little Bear|alp-del,del-eps,eps-zet,zet-bet,bet-gam,gam-eta,eta-zet
cas|Cassiopeia|The Seated Queen|bet-alp,alp-gam,gam-del,del-eps
cep|Cepheus|The King|alp-bet,bet-gam,gam-iot,iot-del,del-zet,zet-eps,eps-alp,alp-eta
dra|Draco|The Dragon|lam-kap,kap-alp,alp-iot,iot-the,the-eta,eta-zet,zet-chi,chi-eps,eps-del,del-xi,xi-nu,nu-bet,bet-gam,gam-xi
lyr|Lyra|The Harp|alp-eps,alp-zet,zet-del,del-gam,gam-bet,bet-zet
cyg|Cygnus|The Swan|alp-gam,gam-bet,del-gam,gam-eps,iot-del,kap-iot,zet-eps,zet-tau,tau-nu,nu-alp
aql|Aquila|The Eagle|bet-alp,alp-gam,gam-zet,zet-eps,alp-del,del-eta,eta-the,del-lam
her|Hercules|The Strongman|eta-zet,zet-eps,eps-pi,pi-eta,eta-sig,sig-tau,zet-bet,bet-gam,bet-alp,del-mu,mu-xi,xi-omi,pi-the,the-iot,zet-del
crb|Corona Borealis|The Northern Crown|the-bet,bet-alp,alp-gam,gam-del,del-eps,eps-iot
boo|Bootes|The Herdsman|alp-eps,eps-del,del-bet,bet-gam,gam-rho,rho-alp,alp-eta,alp-zet
vir|Virgo|The Maiden|alp-zet,zet-gam,gam-eta,eta-bet,gam-del,del-eps,zet-iot,iot-mu
leo|Leo|The Lion|eps-mu,mu-zet,zet-gam,gam-eta,eta-alp,gam-del,del-bet,bet-the,the-alp,del-the
gem|Gemini|The Twins|alp-tau,tau-eps,eps-mu,mu-eta,bet-ups,ups-del,del-zet,zet-gam,del-lam,lam-xi,tau-iot,iot-ups
ori|Orion|The Hunter|alp-lam,lam-gam,alp-gam,gam-del,del-eps,eps-zet,zet-alp,del-eta,eta-bet,zet-kap,eps-iot,gam-pi2,pi2-pi1,pi2-pi3,pi3-pi4,pi4-pi5,pi5-pi6
tau|Taurus|The Bull|eps-del,del-gam,gam-the,the-alp,alp-zet,eps-bet,gam-lam,lam-xi,lam-omi
cma|Canis Major|The Great Dog|bet-alp,alp-iot,iot-omi2,omi2-del,del-eta,del-sig,sig-eps,eps-zet,zet-omi2,alp-gam
cmi|Canis Minor|The Little Dog|alp-bet
aur|Auriga|The Charioteer|alp-bet,bet-the,the-tau.bet,tau.bet-iot,iot-alp,alp-eps,eps-eta,eta-zet,zet-eps,bet-del,alp-del
per|Perseus|The Hero|eta-gam,gam-alp,alp-del,del-nu,nu-eps,eps-xi,xi-zet,zet-omi,alp-bet,bet-rho,alp-iot,iot-the,del-mu,mu-lam,alp-kap,kap-bet,gam-tau,tau-iot
and|Andromeda|The Chained Princess|peg.alp-del,del-bet,bet-gam,bet-mu,mu-nu
peg|Pegasus|The Winged Horse|alp-bet,bet-and.alp,and.alp-gam,gam-alp,alp-zet,zet-the,the-eps,bet-eta,eta-iot,bet-mu
ari|Aries|The Ram|alp-bet,bet-gam
tri|Triangulum|The Triangle|alp-bet,bet-gam,gam-alp
psc|Pisces|The Fishes|gam-the,the-iot,iot-lam,lam-kap,kap-gam,lam-ome,ome-del,del-eps,eps-alp,alp-eta
cet|Cetus|The Sea Monster|gam-alp,gam-del,del-omi,omi-zet,zet-tau,tau-bet,bet-iot,iot-eta,eta-tau
aqr|Aquarius|The Water Bearer|bet-alp,alp-gam,gam-zet,zet-eta,alp-phi,phi-lam,lam-del,bet-eps
cap|Capricornus|The Sea Goat|alp-bet,bet-psi,psi-ome,ome-zet,zet-del,del-gam,gam-the,the-alp
sgr|Sagittarius|The Archer|lam-mu,gam-del,gam-eps,del-eps,del-lam,lam-phi,phi-zet,zet-eps,phi-sig,sig-tau,tau-zet,sig-pi,pi-omi,omi-xi
sco|Scorpius|The Scorpion|bet-del,del-pi,del-sig,sig-alp,alp-tau,tau-eps,eps-mu1,mu1-zet2,zet2-eta,eta-the,the-iot,iot-kap,kap-lam,lam-ups
lib|Libra|The Scales|sig-alp,alp-bet,bet-gam,gam-alp,gam-ups,ups-tau,bet-the
oph|Ophiuchus|The Serpent Bearer|alp-kap,kap-lam,lam-del,del-eps,eps-zet,zet-eta,eta-nu,nu-bet,bet-alp,eta-the
ser|Serpens|The Serpent|gam-bet,bet-del,del-alp,alp-eps,eps-mu,mu-nu,nu-xi,xi-omi,omi-eta
sge|Sagitta|The Arrow|alp-del,bet-del,del-gam
del|Delphinus|The Dolphin|alp-gam,gam-del,del-bet,bet-alp,bet-eps
cvn|Canes Venatici|The Hunting Dogs|alp-bet
cnc|Cancer|The Crab|bet-del,del-gam,gam-iot,del-alp
hya|Hydra|The Water Snake|del-eps,eps-zet,zet-eta,eta-sig,sig-del,sig-the,the-iot,iot-alp,alp-lam,lam-mu,mu-nu,nu-bet,bet-gam,gam-pi
crv|Corvus|The Crow|gam-del,del-bet,bet-eps,eps-gam,eps-alp
crt|Crater|The Cup|alp-gam,gam-del,alp-bet
lep|Lepus|The Hare|eps-mu,mu-alp,alp-bet,bet-gam,gam-del,alp-zet,bet-eps
col|Columba|The Dove|eps-alp,alp-bet,bet-del
mon|Monoceros|The Unicorn|gam-bet,bet-del,del-alp
pup|Puppis|The Stern|zet-rho,rho-xi,zet-pi,pi-nu,pi-sig,sig-zet
vel|Vela|The Sails|gam-lam,lam-psi,psi-mu,mu-kap,kap-del,del-gam
car|Carina|The Keel|alp-bet,bet-ups,ups-ome,ome-the,the-qq,qq-pp,pp-iot,iot-eps,eps-alp
cru|Crux|The Southern Cross|alp-gam,bet-del
cen|Centaurus|The Centaur|alp-bet,bet-eps,eps-zet,zet-gam,gam-del,zet-mu,mu-nu,nu-the,the-iot,nu-eta,eta-kap,gam-sig,sig-rho,rho-del,del-pi,the-psi
lup|Lupus|The Wolf|alp-bet,bet-gam,gam-del,del-eps,eps-alp,eps-zet
ara|Ara|The Altar|alp-bet,bet-gam,bet-zet,zet-del
tra|Triangulum Australe|The Southern Triangle|alp-bet,bet-gam,gam-alp
pav|Pavo|The Peacock|alp-bet,bet-del
gru|Grus|The Crane|gam-del,del-bet,bet-alp,bet-eps
phe|Phoenix|The Phoenix|alp-bet,bet-gam
eri|Eridanus|The River|bet-mu,mu-nu,bet-del,del-gam,gam-tau4,tau4-ups4,ups4-the,the-iot,iot-kap,kap-phi,phi-chi,chi-alp,del-eps,eps-eta
psa|Piscis Austrinus|The Southern Fish|alp-eps
com|Coma Berenices|Berenice's Hair|alp-bet,bet-gam
lyn|Lynx|The Lynx|alp-38
ant|Antlia|The Air Pump|eps-alp,alp-iot
aps|Apus|The Bird of Paradise|alp-del,del-gam,gam-bet
cae|Caelum|The Chisel|alp-bet,bet-gam
cha|Chamaeleon|The Chameleon|alp-gam,gam-del,del-bet
cir|Circinus|The Compasses|bet-alp,alp-gam
cra|Corona Australis|The Southern Crown|eps-gam,gam-alp,alp-bet,bet-del,del-zet,zet-the
dor|Dorado|The Swordfish|gam-alp,alp-zet,zet-bet,bet-del
equ|Equuleus|The Little Horse|alp-del,del-gam,alp-bet
for|Fornax|The Furnace|nu-bet,bet-alp
hor|Horologium|The Pendulum Clock|alp-eta,eta-zet,zet-mu,mu-bet
ind|Indus|The Indian|alp-the,the-bet,the-del
lmi|Leo Minor|The Little Lion|10-21,21-bet,bet-46
men|Mensa|The Table Mountain|bet-gam,gam-alp
mic|Microscopium|The Microscope|alp-gam,gam-eps
mus|Musca|The Fly|lam-eps,eps-alp,alp-bet,bet-del,alp-gam
nor|Norma|The Carpenter's Square|gam-eps,eps-del,del-eta,eta-gam
pic|Pictor|The Painter's Easel|alp-gam,gam-bet
pyx|Pyxis|The Compass|bet-alp,alp-gam
ret|Reticulum|The Reticle|alp-bet,bet-del,del-eps,eps-alp
scl|Sculptor|The Sculptor|alp-del,del-gam,gam-bet
sex|Sextans|The Sextant|gam-alp,alp-bet
tel|Telescopium|The Telescope|eps-alp,alp-zet
vol|Volans|The Flying Fish|gam-del,del-eps,eps-zet,zet-alp,alp-bet,bet-eps
cam|Camelopardalis|The Giraffe|bet-alp,alp-gam
hyi|Hydrus|The Water Snake (south)|alp-bet,bet-gam,gam-alp
lac|Lacerta|The Lizard|bet-alp,alp-4,4-5,5-1
oct|Octans|The Octant|nu-bet,bet-del,del-nu
sct|Scutum|The Shield|bet-alp,alp-gam,alp-del
tuc|Tucana|The Toucan|alp-gam,gam-zet,zet-bet
vul|Vulpecula|The Little Fox|alp-13,13-15
`;

/* Deep-sky objects.  id|name|RA(h)|Dec|mag|kind|distance|eye-visibility note */
const DSO_SRC = `
m45|Pleiades|3.7833|24.1167|1.6|cluster|444 ly|Obvious to the naked eye — a tiny dipper of 6-7 stars
mel25|Hyades|4.4667|15.8667|0.5|cluster|153 ly|The V of Taurus is the cluster itself
m42|Orion Nebula|5.5881|-5.3911|4.0|nebula|1344 ly|A fuzzy "star" in Orion's sword; binoculars show the glow
m31|Andromeda Galaxy|0.7123|41.2687|3.4|galaxy|2.5 million ly|Faint oval smudge — the farthest thing your eye can see
m44|Beehive Cluster|8.6700|19.6700|3.7|cluster|577 ly|A hazy patch in Cancer; binoculars split it into stars
m13|Great Globular in Hercules|16.6948|36.4613|5.8|cluster|22200 ly|A dim round glow inside the Keystone
dblcl|Double Cluster|2.3333|57.1333|4.3|cluster|7500 ly|A brighter knot in the Milky Way between Perseus and Cassiopeia
m7|Ptolemy Cluster|17.8967|-34.7933|3.3|cluster|980 ly|Easy naked-eye patch above the Scorpion's stinger
m6|Butterfly Cluster|17.6683|-32.2167|4.2|cluster|1600 ly|Small misty spot next to M7
m8|Lagoon Nebula|18.0606|-24.3867|6.0|nebula|4100 ly|Faint glow above the Teapot's spout
m22|Sagittarius Cluster|18.6064|-23.9047|5.1|cluster|10600 ly|Fuzzy spot just off the Teapot's lid
lmc|Large Magellanic Cloud|5.3925|-69.7561|0.9|galaxy|163000 ly|Looks like a detached piece of the Milky Way (southern skies)
smc|Small Magellanic Cloud|0.8767|-72.8286|2.7|galaxy|200000 ly|A smaller pale cloud near 47 Tucanae (southern skies)
ngc104|47 Tucanae|0.4008|-72.0808|4.1|cluster|13000 ly|Looks like a fat fuzzy star beside the Small Magellanic Cloud
ic2602|Southern Pleiades|10.7150|-64.4000|1.9|cluster|479 ly|Bright scatter of stars around theta Carinae
ngc5139|Omega Centauri|13.4463|-47.4794|3.9|cluster|17000 ly|The biggest globular cluster in the sky — a hazy "star" in Centaurus
`;

/* Plain-language notes for the stars worth knowing. */
const NOTES = {
  'cma-alp': 'The brightest star in the whole night sky, and one of the closest. It flashes red and green when it is low down — that is our own atmosphere, not the star.',
  'ori-alp': 'A red supergiant so big that if you dropped it where the Sun is, it would swallow Mars. It will explode as a supernova — sometime in the next 100,000 years.',
  'ori-bet': 'A blue supergiant pouring out about 100,000 times the light of the Sun. Blue means hot: roughly 12,000°C at the surface.',
  'boo-alp': 'The brightest star in the northern half of the sky. Orange, old, and moving fast — it is a visitor from a different part of the galaxy.',
  'lyr-alp': 'Was the pole star 14,000 years ago, and will be again in another 12,000. For a century it was THE reference star: magnitude zero is defined near Vega.',
  'umi-alp': 'The pole star. It sits almost exactly above Earth\'s north pole, so it barely moves all night while everything else wheels around it.',
  'tau-alp': 'The bull\'s orange eye. It looks like part of the V-shaped Hyades cluster but is actually less than half as far away — a line-of-sight coincidence.',
  'aur-alp': 'Sixth-brightest star in the sky and the most northerly bright one. It is really two yellow giants orbiting each other every 104 days.',
  'cmi-alp': 'Close neighbour — only 11.5 light years. The light hitting your eye left it while you were a child.',
  'vir-alp': 'A pair of enormous blue stars whipping around each other every four days, so close that tides pull them into egg shapes.',
  'sco-alp': 'The "rival of Mars" — a red supergiant marking the Scorpion\'s heart. Compare its colour to Mars when the planet passes nearby.',
  'cyg-alp': 'One of the most luminous stars you can see: about 2,600 light years away and still first magnitude. Up close it would outshine the full Moon.',
  'aql-alp': 'Spins so fast — once every 9 hours — that it is visibly squashed. Only 17 light years away.',
  'leo-alp': 'Sits almost exactly on the ecliptic, so the Moon and planets regularly pass right over it.',
  'gem-bet': 'The nearer, brighter twin: an orange giant 34 light years away with a known planet.',
  'gem-alp': 'Looks like one star but is six: three pairs bound together in one system.',
  'uma-zet': 'Mizar has a companion, Alcor, right beside it. Spotting the two separately was a classic eyesight test.',
  'per-bet': 'The "Demon Star". Every 2.87 days an unseen companion eclipses it and it visibly fades for ten hours. Watch it over a week.',
  'cet-omi': 'Mira, "the wonderful". Over 332 days it swells from invisible to easily naked-eye and back again.',
  'cen-alp': 'The closest star system to the Sun, 4.4 light years away. Two sun-like stars, plus the faint red dwarf Proxima with its planets.',
  'car-alp': 'Second-brightest star in the sky. Never rises for most of Europe and North America — a southern treasure.',
  'cru-gam': 'The red top of the Southern Cross. Its colour is the quickest way to tell the real Cross from the "False Cross" nearby.',
  'ori-eps': 'The middle star of Orion\'s Belt, and the most distant thing in the Belt: around 2,000 light years.',
  'uma-alp': 'The outer Pointer. Draw a line from Merak through Dubhe and keep going — it lands on Polaris.',
  'uma-bet': 'The inner Pointer. Merak and Dubhe are the two stars that aim at the pole star.',
  'psa-alp': 'The "Lonely One of Autumn" — it sits in an empty patch of sky, so nothing competes with it.',
  'and-bet': 'Your stepping stone to the Andromeda Galaxy: from Mirach, hop two faint stars north.',
  'tau-bet': 'Shared between two constellations: it is the bull\'s northern horn tip and also a corner of Auriga\'s pentagon.',
  'crb-alp': 'The jewel in the little arc of the Northern Crown — one of the easiest small patterns to recognise.',
  'sco-lam': 'The stinger. Shaula and Lesath sit side by side like the two barbs of a scorpion\'s tail.',
  'cma-eps': 'To ultraviolet eyes this would be the brightest star in the sky — it is simply too hot for ours to appreciate.',
  'dra-alp': 'Thuban was the pole star when the Egyptian pyramids were built. Earth\'s axis wobbles, so the pole star changes over millennia.'
};

/* Named asterisms: the shapes people actually use to find their way. */
const ASTERISMS = [
  { id:'dipper', name:'The Big Dipper', also:'The Plough', stars:['uma-alp','uma-bet','uma-gam','uma-del','uma-eps','uma-zet','uma-eta'],
    path:[['uma-alp','uma-bet'],['uma-bet','uma-gam'],['uma-gam','uma-del'],['uma-del','uma-alp'],['uma-del','uma-eps'],['uma-eps','uma-zet'],['uma-zet','uma-eta']] },
  { id:'littledipper', name:'The Little Dipper', stars:['umi-alp','umi-del','umi-eps','umi-zet','umi-bet','umi-gam','umi-eta'],
    path:[['umi-alp','umi-del'],['umi-del','umi-eps'],['umi-eps','umi-zet'],['umi-zet','umi-bet'],['umi-bet','umi-gam'],['umi-gam','umi-eta'],['umi-eta','umi-zet']] },
  { id:'w', name:'The W', also:'Cassiopeia', stars:['cas-bet','cas-alp','cas-gam','cas-del','cas-eps'],
    path:[['cas-bet','cas-alp'],['cas-alp','cas-gam'],['cas-gam','cas-del'],['cas-del','cas-eps']] },
  { id:'belt', name:"Orion's Belt", stars:['ori-del','ori-eps','ori-zet'],
    path:[['ori-del','ori-eps'],['ori-eps','ori-zet']] },
  { id:'summer', name:'The Summer Triangle', stars:['lyr-alp','cyg-alp','aql-alp'],
    path:[['lyr-alp','cyg-alp'],['cyg-alp','aql-alp'],['aql-alp','lyr-alp']] },
  { id:'wintertri', name:'The Winter Triangle', stars:['ori-alp','cma-alp','cmi-alp'],
    path:[['ori-alp','cma-alp'],['cma-alp','cmi-alp'],['cmi-alp','ori-alp']] },
  { id:'hexagon', name:'The Winter Hexagon', stars:['ori-bet','cma-alp','cmi-alp','gem-bet','aur-alp','tau-alp'],
    path:[['ori-bet','cma-alp'],['cma-alp','cmi-alp'],['cmi-alp','gem-bet'],['gem-bet','aur-alp'],['aur-alp','tau-alp'],['tau-alp','ori-bet']] },
  { id:'square', name:'The Great Square', also:'Pegasus', stars:['peg-alp','peg-bet','peg-gam','and-alp'],
    path:[['peg-alp','peg-bet'],['peg-bet','and-alp'],['and-alp','peg-gam'],['peg-gam','peg-alp']] },
  { id:'teapot', name:'The Teapot', also:'Sagittarius', stars:['sgr-gam','sgr-del','sgr-eps','sgr-lam','sgr-phi','sgr-sig','sgr-tau','sgr-zet'],
    path:[['sgr-gam','sgr-del'],['sgr-gam','sgr-eps'],['sgr-del','sgr-eps'],['sgr-del','sgr-lam'],['sgr-lam','sgr-phi'],['sgr-phi','sgr-zet'],['sgr-zet','sgr-eps'],['sgr-phi','sgr-sig'],['sgr-sig','sgr-tau'],['sgr-tau','sgr-zet']] },
  { id:'cross', name:'The Northern Cross', also:'Cygnus', stars:['cyg-alp','cyg-gam','cyg-bet','cyg-del','cyg-eps'],
    path:[['cyg-alp','cyg-gam'],['cyg-gam','cyg-bet'],['cyg-del','cyg-gam'],['cyg-gam','cyg-eps']] },
  { id:'sickle', name:'The Sickle', also:'the head of Leo', stars:['leo-alp','leo-eta','leo-gam','leo-zet','leo-mu','leo-eps'],
    path:[['leo-eps','leo-mu'],['leo-mu','leo-zet'],['leo-zet','leo-gam'],['leo-gam','leo-eta'],['leo-eta','leo-alp']] },
  { id:'keystone', name:'The Keystone', also:'the body of Hercules', stars:['her-eta','her-zet','her-eps','her-pi'],
    path:[['her-eta','her-zet'],['her-zet','her-eps'],['her-eps','her-pi'],['her-pi','her-eta']] },
  { id:'southerncross', name:'The Southern Cross', also:'Crux', stars:['cru-alp','cru-bet','cru-gam','cru-del'],
    path:[['cru-alp','cru-gam'],['cru-bet','cru-del']] },
  { id:'pointers', name:'The Southern Pointers', stars:['cen-alp','cen-bet'],
    path:[['cen-alp','cen-bet']] }
];

/* How to say it, and what the name means. Most bright-star names are Arabic, via medieval Latin. */
const SAY = {
  'cma-alp': ['SEER-ee-us', 'Greek “scorching” — it rose with the hottest days of summer'],
  'car-alp': ['kuh-NOH-pus', 'Named for the helmsman of a Greek fleet'],
  'cen-alp': ['RYE-jil ken-TOR-us', 'Arabic “foot of the centaur”'],
  'boo-alp': ['ark-TOOR-us', 'Greek “guardian of the bear” — it follows the Great Bear round the pole'],
  'lyr-alp': ['VEE-guh', 'Arabic “the swooping eagle”'],
  'aur-alp': ['kuh-PEL-uh', 'Latin “little she-goat”'],
  'ori-bet': ['RYE-jel', 'Arabic “the foot” of the giant'],
  'cmi-alp': ['PRO-see-on', 'Greek “before the dog” — it rises just ahead of Sirius'],
  'ori-alp': ['BET-el-jooz', 'Arabic, roughly “hand of the giant” — a medieval misreading stuck'],
  'eri-alp': ['AY-ker-nar', 'Arabic “end of the river”'],
  'cen-bet': ['HAY-dar', 'Arabic “ground”'],
  'aql-alp': ['AL-tair', 'Arabic “the flying eagle”'],
  'cru-alp': ['AY-krux', 'Modern contraction of “Alpha Crucis”'],
  'tau-alp': ['al-DEB-uh-ran', 'Arabic “the follower” — it follows the Pleiades across the sky'],
  'vir-alp': ['SPY-kuh', 'Latin “ear of wheat” held by the maiden'],
  'sco-alp': ['an-TAIR-eez', 'Greek “rival of Ares (Mars)”'],
  'gem-bet': ['POL-ux', 'One of the twin brothers of Greek myth'],
  'gem-alp': ['KAS-ter', 'The other twin'],
  'psa-alp': ['FOH-mah-lot', 'Arabic “mouth of the fish”'],
  'cyg-alp': ['DEN-ebb', 'Arabic “tail” — of the swan'],
  'cru-bet': ['mi-MOH-suh', 'Latin, after the mimosa flower'],
  'leo-alp': ['REG-yoo-lus', 'Latin “little king”'],
  'cma-eps': ['uh-DAR-uh', 'Arabic “the virgins”'],
  'cru-gam': ['GAY-krux', 'Modern contraction of “Gamma Crucis”'],
  'sco-lam': ['SHOW-luh', 'Arabic “the raised tail”'],
  'ori-gam': ['beh-LAY-trix', 'Latin “female warrior”'],
  'tau-bet': ['EL-nath', 'Arabic “the butting one” — the bull\'s horn'],
  'car-bet': ['my-uh-PLASS-ih-dus', 'Arabic–Latin blend, “placid waters”'],
  'ori-eps': ['al-NIL-am', 'Arabic “string of pearls” — the whole Belt'],
  'ori-zet': ['al-NYE-tak', 'Arabic “the girdle”'],
  'ori-del': ['MIN-tuh-kuh', 'Arabic “the belt”'],
  'gru-alp': ['al-NAIR', 'Arabic “the bright one”'],
  'uma-eps': ['AL-ee-oth', 'Arabic, probably “fat tail” — of a sheep, before it was a bear'],
  'uma-alp': ['DUB-ee', 'Arabic “the bear”'],
  'uma-bet': ['MEH-rak', 'Arabic “the loins” of the bear'],
  'uma-gam': ['FEK-duh', 'Arabic “the thigh”'],
  'uma-del': ['MEG-rez', 'Arabic “root of the tail”'],
  'uma-zet': ['MY-zar', 'Arabic “the waistband”'],
  'uma-eta': ['AL-kade', 'Arabic “leader of the mourners”'],
  'uma-alc': ['AL-kor', 'Arabic, possibly “the faint one”'],
  'per-alp': ['MEER-fak', 'Arabic “the elbow”'],
  'per-bet': ['AL-gol', 'Arabic “the demon’s head” — the head of Medusa'],
  'umi-alp': ['poh-LAR-iss', 'Latin “of the pole”'],
  'umi-bet': ['KOH-kab', 'Arabic “the star”'],
  'cas-alp': ['SHED-ar', 'Arabic “the breast” — of the queen'],
  'cas-bet': ['KAF', 'Arabic “the hand” (stained with henna)'],
  'and-alp': ['al-FEER-ats', 'Arabic “navel of the horse” — it used to belong to Pegasus'],
  'and-bet': ['MY-rak', 'Arabic “the loins”'],
  'and-gam': ['AL-mak', 'Arabic, after a desert wildcat'],
  'peg-alp': ['MAR-kab', 'Arabic “the saddle”'],
  'peg-bet': ['SHEE-at', 'Arabic, probably “the shin”'],
  'peg-eps': ['EE-nif', 'Arabic “the nose” — of the horse'],
  'ari-alp': ['HAM-ul', 'Arabic “the lamb”'],
  'cet-bet': ['DIF-duh', 'Arabic “the second frog”'],
  'cet-omi': ['MY-ruh', 'Latin “wonderful”'],
  'leo-bet': ['deh-NEB-oh-luh', 'Arabic “tail of the lion”'],
  'leo-gam': ['al-JEE-buh', 'Arabic “the forehead”'],
  'boo-eps': ['EYE-zar', 'Arabic “the loincloth”'],
  'crb-alp': ['al-FEK-uh', 'Arabic “the broken one” — the crown has a gap'],
  'her-alp': ['ras-al-JEE-thee', 'Arabic “head of the kneeling one”'],
  'oph-alp': ['RAS-al-hayg', 'Arabic “head of the serpent charmer”'],
  'dra-gam': ['el-TAY-nin', 'Arabic “the dragon”'],
  'dra-alp': ['THOO-ban', 'Arabic “the serpent”'],
  'cyg-bet': ['al-BEER-ee-oh', 'A medieval copying error that became a name'],
  'cyg-gam': ['SAD-er', 'Arabic “the breast” — of the swan'],
  'aql-gam': ['TARA-zed', 'Persian “the plundering falcon”'],
  'hya-alp': ['AL-fard', 'Arabic “the solitary one” — nothing bright is near it'],
  'lep-alp': ['AR-neb', 'Arabic “the hare”'],
  'sgr-eps': ['KOSS aw-STRAY-liss', 'Arabic + Latin, “southern part of the bow”'],
  'sgr-sig': ['NUN-kee', 'From Babylonian — one of the oldest star names in use'],
  'lib-alp': ['zoo-BEN-el-jeh-NOO-bee', 'Arabic “the southern claw” — Libra was once the scorpion’s claws'],
  'lib-bet': ['zoo-BEN-esh-uh-MAH-lee', 'Arabic “the northern claw”'],
  'cma-bet': ['MUR-zam', 'Arabic “the herald” — it rises just before Sirius'],
  'cma-del': ['WEE-zen', 'Arabic “weight”'],
  'aur-bet': ['men-KAL-in-an', 'Arabic “shoulder of the rein-holder”'],
  'cvn-alp': ['kor KAR-oh-lye', 'Latin “heart of Charles”, for Charles I of England'],
  'cen-the': ['MEN-kent', 'Arabic “shoulder of the centaur”'],
  'vel-gam': ['REE-gor', 'A tribute to astronaut Roger Chaffee, spelled backwards'],
  'pav-alp': ['PEE-kok', 'Given by the Royal Air Force for navigation in the 1930s'],
  'tra-alp': ['AT-ree-uh', 'Contraction of “Alpha Trianguli Australis”'],
  'sgr-zet': ['uh-SELL-uh', 'Latin “armpit”']
};

/* The four hand measures astronomers have used for centuries. Degrees at arm's length. */
const HANDS = [
  { deg: 1,  name: 'little finger', short: 'pinkie' },
  { deg: 2,  name: 'thumb',          short: 'thumb' },
  { deg: 5,  name: 'three fingers',  short: '3 fingers' },
  { deg: 10, name: 'fist',           short: 'fist' },
  { deg: 20, name: 'spread hand',    short: 'handspan' }
];
