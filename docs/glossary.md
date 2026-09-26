# Glossary

The terms each locale uses for the course's concepts. Read it before translating anything, and add
every new term in the same commit as the translation that introduces it.

## How to record a term

For each important term record: the English definition (one line, as the course means it), the
chosen term per locale, rejected alternatives and why, the source that settled it (see the
per-locale source table in `AGENTS.md`), and the first chapter that uses it. Add a note when the
student-friendly word differs from the textbook one (e.g. "map of s" before Chapter 7, "s-plane"
from Chapter 7 on).

When a locale has two words for one concept, pick one, fix every string, and remove the entry from
"Open terminology questions" below. If the difference is deliberate (a label vs. a friendlier word
in prose), write that down here so the next translator doesn't "fix" it.

## Core terms

Collected from the locale files as the course uses them today (2026-09-26). Sources and rejected
alternatives are still to be filled in during native review.

| Term | First ch | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|---|
| feedback | ch01 | rétroaction | realimentación | retroazione | Rückkopplung | sprzężenie zwrotne | realimentação | フィードバック | 反馈 | التغذية الراجعة |
| open loop | ch01 | boucle ouverte | lazo abierto | anello aperto | offener Regelkreis | układ otwarty | malha aberta | 開ループ | 开环 | الحلقة المفتوحة |
| closed loop | ch01 | boucle fermée | lazo cerrado | anello chiuso | geschlossener Regelkreis | układ zamknięty | malha fechada | 閉ループ | 闭环 | الحلقة المغلقة |
| setpoint | ch01 | consigne | consigna | riferimento | Sollwert | wartość zadana | valor de referência | 目標値 | 给定值 | القيمة المرجعية |
| output | ch01 | sortie | salida | uscita | Ausgang | wyjście | saída | 出力 | 输出 | الخرج |
| error | ch01 | erreur | error | errore | Regelabweichung (prose: Fehler) | uchyb | erro | 偏差 | 误差 | الخطأ |
| control effort | ch01 | commande | esfuerzo de control | sforzo di controllo | Stellgröße | sygnał sterujący | esforço de controle | 操作量 | 控制量 | إشارة التحكم |
| disturbance | ch01 | perturbation | perturbación | disturbo | Störung | zakłócenie | perturbação | 外乱 | 扰动 | اضطراب |
| plant | ch01 | système (procédé) | planta | impianto | Regelstrecke | obiekt (sterowania) | planta | 制御対象 | 被控对象 | النظام الخاضع للتحكم |
| controller | ch01 | correcteur | controlador | controllore | Regler | regulator | controlador | コントローラ(ー) | 控制器 | المتحكم |
| block diagram | ch01 | schéma-bloc | diagrama de bloques | schema a blocchi | Blockschaltbild | schemat blokowy | diagrama de blocos | ブロック線図 | 框图 | المخطط الصندوقي |
| gain | ch02 | gain | ganancia | guadagno | Verstärkung | wzmocnienie | ganho | ゲイン | 增益 | الكسب |
| proportional (P) | ch02 | commande / gain proportionnel(le) | control proporcional | controllo proporzionale | Proportionalregelung / -verstärkung | regulacja proporcjonalna | controle proporcional | 比例制御 | 比例控制 | التحكم التناسبي |
| integral gain Ki | ch03 (maths), ch09 | gain intégral | ganancia integral | guadagno integrale | Integralverstärkung | wzmocnienie całkujące | ganho integral | 積分ゲイン | 积分增益 | كسب التكامل |
| derivative gain Kd | ch03 (maths), ch09 | gain dérivé | ganancia derivativa | guadagno derivativo | Differenzialverstärkung | wzmocnienie różniczkujące | ganho derivativo | 微分ゲイン | 微分增益 | كسب المشتقة |
| droop | ch02 | affaissement | caída | abbassamento | Durchhängen | zwis | desvio residual | 定常偏差 (prose: ドループ) | 稳态偏差 | الانخفاض المستمر |
| steady-state error | ch02 | erreur statique | error en estado estacionario | errore a regime | bleibende Regelabweichung | uchyb ustalony | erro em regime permanente | 定常偏差 | 稳态误差 | خطأ الحالة المستقرة |
| overshoot | ch02 | dépassement | sobreimpulso | sovraelongazione | Überschwingen | przeregulowanie | sobressinal | オーバーシュート | 超调 | التجاوز |
| damping | ch06 | amortissement | amortiguamiento | smorzamento | Dämpfung | tłumienie | amortecimento | 減衰 | 阻尼 | التخميد |
| damping ratio ζ | ch06 | taux d'amortissement | coeficiente de amortiguamiento | coefficiente di smorzamento | Dämpfungsgrad | współczynnik tłumienia | razão de amortecimento | 減衰比 | 阻尼比 | نسبة التخميد |
| natural frequency ωn | ch06 | pulsation propre | frecuencia natural | pulsazione naturale | Eigenkreisfrequenz | pulsacja własna | frequência natural | 固有振動数 | 自然频率 | التردد الطبيعي |
| "map of s" (before ch07) | ch05 | la carte de s | el mapa de s | la mappa di s | die Karte von s | mapa s | o mapa de s | sの地図 | s 的地图 | خريطة s |
| Laplace transform | ch07 | transformée de Laplace | transformada de Laplace | trasformata di Laplace | Laplace-Transformation | transformata Laplace'a | transformada de Laplace | ラプラス変換 | 拉普拉斯变换 | تحويل لابلاس |
| s-plane (from ch07) | ch07 | plan s | plano s | piano s | s-Ebene | płaszczyzna s | plano s | s平面 | s 平面 | المستوى s |
| transfer function | ch08 | fonction de transfert | función de transferencia | funzione di trasferimento | Übertragungsfunktion | transmitancja | função de transferência | 伝達関数 | 传递函数 | دالة النقل |
| pole | ch08 | pôle | polo | polo | Pol | biegun | polo | 極 | 极点 | القطب |
| zero | ch08 | zéro | cero | zero | Nullstelle | zero | zero | 零点 | 零点 | الصفر |
| stable / unstable | ch08 | stable / instable | estable / inestable | stabile / instabile | stabil / instabil | stabilny / niestabilny | estável / instável | 安定 / 不安定 | 稳定 / 不稳定 | مستقر / غير مستقر |
| sensor noise | ch09 | bruit du capteur | ruido del sensor | rumore del sensore | Sensorrauschen | szum czujnika | ruído do sensor | センサーノイズ | 传感器噪声 | ضوضاء المستشعر |
| phase margin | ch10 | marge de phase | margen de fase | margine di fase | Phasenreserve | zapas fazy | margem de fase | 位相余裕 | 相位裕度 | هامش الطور |
| gain margin | ch10 | marge de gain | margen de ganancia | margine di guadagno | Amplitudenreserve | zapas wzmocnienia | margem de ganho | ゲイン余裕 | 增益裕度 | هامش الكسب |

Settling time is listed with the Chapter 4 and 6 terms below.

## Chapter 4 and 6 terms

Chosen during the Chapter 4/6 extension (`docs/plans/ch04-06-extension.md`).

| Term | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| side trip | Petit détour | Desvío | Deviazione | Abstecher | Dygresja | Desvio | 寄り道 | 绕个小弯 | استطراد |
| critical damping | amortissement critique | amortiguamiento crítico | smorzamento critico | kritische Dämpfung | tłumienie krytyczne | amortecimento crítico | 臨界減衰 | 临界阻尼 | التخميد الحرج |
| damped frequency | pseudo-pulsation | frecuencia amortiguada | pulsazione smorzata | gedämpfte Eigenkreisfrequenz | pulsacja tłumiona | frequência amortecida | 減衰固有振動数 | 阻尼振荡频率 | التردد المخمَّد |
| mode | mode | modo | modo | Modus (Modi) | mod (mody) | modo | モード | 模态 | نمط (أنماط) |
| step response | réponse indicielle | respuesta al escalón | risposta al gradino | Sprungantwort | odpowiedź skokowa | resposta ao degrau | ステップ応答 | 阶跃响应 | استجابة الخطوة |
| settling time | temps de réponse à 2 % | tiempo de establecimiento | tempo di assestamento | Einschwingzeit | czas ustalania | tempo de acomodação | 整定時間 | 稳定时间 | زمن الاستقرار |
| natural logarithm | logarithme népérien | logaritmo natural | logaritmo naturale | natürlicher Logarithmus | logarytm naturalny | logaritmo natural | 自然対数 | 自然对数 | اللوغاريتم الطبيعي |

## Shared s-plane labels (Chapters 7–11 extension, Phase 1)

Short labels the s-plane draws or announces itself (`common:splane.*`), used from Chapter 8 on.

| Term | Definition | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|---|
| double (pole) | a mirror pair that has met on the real axis: two poles at one spot | double | doble | doppio | doppelt | podwójny | duplo | 重根 | 重根 | مزدوج |
| off the map | a pole too far out to draw; the arrow at the edge points at it | hors de la carte | fuera del mapa | fuori dalla mappa | außerhalb der Karte | poza mapą | fora do mapa | マップの外 | 超出图外 | خارج الخريطة |

"Settles ≈ … s" on the s-plane's settling lines (`common:splane.settles`) uses each
locale's settling-time term (see the Chapter 4 and 6 table).

## Chapters 7–11 terms

Chosen during the Chapters 7–11 extension (`docs/plans/ch07-11-extension.md`). Chapter agents add
rows here as they introduce terms. "Map" in the first column means the term is (also) a
concept-map label in `common.json` (`map.nodes.<id>`).

| Term (definition) | First ch | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|---|
| frequency response: how much a system scales and delays a sine wave at each wiggle speed | ch10 | réponse en fréquence | respuesta en frecuencia | risposta in frequenza | Frequenzgang | charakterystyka częstotliwościowa | resposta em frequência | 周波数応答 | 频率响应 | الاستجابة الترددية |
| Bode plot: the frequency response drawn as gain and phase against wiggle speed | ch10 | diagramme de Bode | diagrama de Bode | diagramma di Bode | Bode-Diagramm | charakterystyki Bodego (map: wykres Bodego) | diagrama de Bode | ボード線図 | 波特图 | مخطط بود |
| Map `bode`: "frequency response (Bode plot)" | ch10 | réponse en fréquence (diagramme de Bode) | respuesta en frecuencia (diagrama de Bode) | risposta in frequenza (diagramma di Bode) | Frequenzgang (Bode-Diagramm) | charakterystyka częstotliwościowa (wykres Bodego) | resposta em frequência (diagrama de Bode) | 周波数応答（ボード線図） | 频率响应（波特图） | الاستجابة الترددية (مخطط بود) |
| motor limits: the motors can only push between 0 and 20 N; a command outside is cut off (map `limits`) | ch08 | limites des moteurs | límites del motor | limiti dei motori | Motorgrenzen | ograniczenia silników | limites do motor | モーター限界 | 电机限制 | حدود المحرك |
| motor lag: the thrust asked for arrives a moment later; a first-order lag with time constant τm (map `motorlag`) | ch11 | retard des moteurs | retraso de los motores | ritardo dei motori | Motorverzögerung | bezwładność silników | atraso do motor | モーターの遅れ | 电机滞后 | تأخر المحركات |
| fast vs calm: the trade-off between a quick arrival and quiet motors under sensor noise (map `tradeoff`) | ch11 | rapide ou calme | rápido o tranquilo | veloce o calmo | schnell oder ruhig | szybko czy spokojnie | rápido ou calmo | 速さか落ち着きか | 快还是稳 | السرعة أم الهدوء |
| smoother: the shower's first-order lag (head and pipe walls warming up, τ = 1 s); follows its input, shrinking and delaying fast wiggles, never past 90°. The one Ch 10 word for it (replaces "thermal response/lag", "mixing") | ch10 | | | | | | | | | |
| loop symbol $G_{\circ}(s)$: the trip once around the loop (controller × shower). Chosen over $L(s)$ because $L$ is the delay; the small circle reads "loop". Maths, identical in every locale | ch10 | | | | | | | | | |
| share of a wiggle: $L/T$, the fraction of one period a delay covers; × 360° gives the phase lag | ch10 | | | | | | | | | |
| pile (of a wiggle): what an I controller / speed hand does: area under the error; lags every wiggle 90°, 1/ω as big | ch10 | | | | | | | | | |
| speed hand / position hand: a hand that turns the knob at a speed ∝ error (I controller) vs. one that puts the knob at a spot ∝ error (P controller) | ch10 | | | | | | | | | |
| squashed ruler: the course's word for a logarithmic axis (each ×10 is one equal step) | ch10 | | | | | | | | | |
| hunting: a steady self-sustained oscillation of a control loop at its edge | ch10 | | | | | | | | | |
| phase lead: reacting earlier (P or D mixed into I) gives back phase | ch10 | | | | | | | | | |
| delay margin: how many seconds longer the delay could get before the loop starts to hunt (phase margin in radians ÷ gain-of-1 speed) | ch10 | | | | | | | | | |
| −180° speed / gain-of-1 speed: the wiggle speeds where the loop phase is −180° and where the loop gain is 1 (phase and gain crossover) | ch10 | | | | | | | | | |
| underdamped / critically damped / overdamped (`common:regime.*`, shared since the Ch 7–11 pass) | ch06 | sous-amorti / amortissement critique / sur-amorti | subamortiguado / con amortiguamiento crítico / sobreamortiguado | sottosmorzato / a smorzamento critico / sovrasmorzato | unterdämpft / kritisch gedämpft / überdämpft | niedotłumiony / tłumiony krytycznie / przetłumiony | subamortecido / criticamente amortecido / superamortecido | 不足減衰 / 臨界減衰 / 過減衰 | 欠阻尼 / 临界阻尼 / 过阻尼 | تحت التخميد / تخميد حرج / فوق التخميد |
| integral action / the pile: the part of the controller that pushes in proportion to the accumulated past error | ch09 | | | | | | | | | |
| integrator time constant τ_I ≈ Kp/Ki: how long the pile takes to get 63% of the way to holding the weight | ch09 | | | | | | | | | |
| Routh–Hurwitz criterion: a test on the coefficients that tells whether all poles are in the left half | ch09 | | | | | | | | | |
| derivative kick: a thrust spike caused by taking the slope of an error that jumps | ch09 | | | | | | | | | |
| derivative on measurement: taking D from the measured height instead of from the error | ch09 | | | | | | | | | |
| derivative filter τ_f: a first-order smoothing lag applied to the reading before taking its slope | ch09 | | | | | | | | | |
| integrator windup / anti-windup: the pile growing while the motors are pinned, and the fix of pausing it | ch09 | | | | | | | | | |
| motors pinned (saturated): the motor command sitting at 0 N or 20 N, with no room left to correct | ch09 | | | | | | | | | |
| (near) pole–zero cancellation: a zero close to a pole, so that mode barely shows in the response | ch09 | | | | | | | | | |
| ringing: still swinging (stable, but the swings die slowly) | ch09 | | | | | | | | | |

Notes:
- Chapter 10 rows with empty locale cells were added with the English text (Phase 5 of the
  Ch 7–11 extension); translators fill them. Keep "gain" the same word as the controller's gain
  (the chapter says so: size out ÷ size in).
- The map labels were taken from the words the chapters already use (Ch 8's "motor limits"
  captions, Ch 10's "frequency response"/"Bode plot" sentence, Ch 11's "Motor lag" item and its
  "motors calm" star), so the map and the prose agree. pl keeps "bezwładność silników" because
  Ch 11 uses it and a first-order lag is "człon inercyjny"; the Bode-plot map label says
  "wykres Bodego" where the Ch 10 prose says "charakterystyki Bodego" (shorter in a bubble, same
  meaning). All need native review.
- es/it: the "critical" regime is the adjectival form ("con amortiguamiento crítico",
  "a smorzamento critico") so it reads right both as a readout and inside a sentence.
- Long map labels wrap by themselves at spaces (and after "-" or "/"). Japanese and Chinese
  labels have no spaces, so they carry an explicit "\n" where a break is needed.

## Open terminology questions

Places where one concept currently has two words. Found by comparing the locale files on
2026-09-26 (key paths are examples, not the full list). Settle each one with a native reviewer who knows control engineering,
then fix every string and delete the entry.

**Droop vs. steady-state error**
- ja: droop is ドループ in prose (ch02, ch09) but 定常偏差 in readouts, headings and the concept
  map, the same word as steady-state error, so the two concepts merge.
- zh-CN: droop 稳态偏差 vs. steady-state error 稳态误差 (偏差 and 误差 mixed).
- pt-BR: "desvio residual" everywhere except `ch09:widgets.integral.readout.droop` ("queda residual").
- ar: the concept-map node `common:map.nodes.integralaction` uses the steady-state-error term
  instead of the droop term.

**Settling time**
- fr: "temps de réponse à 2 %" (ch06) vs. "temps de stabilisation" (ch08, ch09). The widget also
  says "stabilisé".
- es: "tiempo de establecimiento" (ch06) vs. "tiempo de estabilización" (ch08, ch09); "asentamiento"
  also considered.
- zh-CN: 稳定时间 (ch06, part of ch08) vs. 调节时间 (rest of ch08, ch09).

**Overshoot**
- pt-BR: "ultrapassagem do alvo" in ch02 widgets vs. "sobressinal" everywhere else.

**"Map of s" before Chapter 7**
- zh-CN: `ch05:widgets.smap.title` says s 的映射图 (elsewhere s 的地图); s 平面 used too early in
  `ch05:sections.5.blocks.1.items.2.q` and `ch06:widgets.personality.planeAria`.
- pt-BR: "plano s" used too early in the same two keys.
- ja: sの地図 vs. sのマップ (`ch05:widgets.smap.mapAria`, the ch07 callback).

**Error**
- de: "Regelabweichung" in glossary, legend and map vs. "Fehler" in prose. Possibly deliberate
  (the glossary says "kurz: der Fehler"); if so, record it above.
- ja: 偏差 almost everywhere, 誤差 in a few ch02/ch06 strings (numerical rounding error in ch07/ch09
  is fine).

**Other**
- ja: controller コントローラ / コントローラー / 制御器; sensor センサ / センサー; block diagram
  ブロック図 once (`ch01:sections.5.blocks.0.items.3`).
- ar: block diagram مخطط كتلي in ch01 aria labels; sensor الحساس vs. المستشعر (concept map vs. ch09
  toggle); gain الربح in one ch10 quiz option.
- fr: "régulateur" for the ch01 cruise-control diagram vs. "correcteur" elsewhere (standard for
  cruise control; decide if it stays).
- de: "Modi" vs. "Moden" for modes.
- ar: Bernoulli spelling (ياكوب / يعقوب).
- ja: pronouns and one polite-style paragraph in ch06.
- Cast gender: Mika is masculine in it/ar, feminine in pl, neutral phrasing in es/pt-BR. Settle it
  per language in a cast sheet.
- ar numerals: Western (0–9) or Eastern Arabic (٠–٩) digits; agree on one with an Arabic reviewer.
