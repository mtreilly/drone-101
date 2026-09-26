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

Collected from the locale files as the course uses them today (2026-09-26; re-checked after the
Chapters 7–11 pass). Sources and rejected alternatives are still to be filled in during native review.
Droop and steady-state error are two terms on purpose: in ja/zh-CN/ar the steady-state-error word
appears only where ch02 names both and in the map node `sserror`.

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
| controller | ch01 | correcteur (ch01 cruise control: régulateur de vitesse) | controlador | controllore | Regler | regulator | controlador | コントローラー | 控制器 | المتحكم |
| sensor | ch01 | capteur | sensor | sensore | Sensor | czujnik | sensor | センサー | 传感器 | المستشعر |
| block diagram | ch01 | schéma-bloc | diagrama de bloques | schema a blocchi | Blockschaltbild | schemat blokowy | diagrama de blocos | ブロック線図 | 框图 | المخطط الكتلي |
| gain | ch02 | gain | ganancia | guadagno | Verstärkung | wzmocnienie | ganho | ゲイン | 增益 | الكسب |
| proportional (P) | ch02 | commande / gain proportionnel(le) | control proporcional | controllo proporzionale | Proportionalregelung / -verstärkung | regulacja proporcjonalna | controle proporcional | 比例制御 | 比例控制 | التحكم التناسبي |
| integral gain Ki | ch03 (maths), ch09 | gain intégral | ganancia integral | guadagno integrale | Integralverstärkung | wzmocnienie całkujące | ganho integral | 積分ゲイン | 积分增益 | كسب التكامل |
| derivative gain Kd | ch03 (maths), ch09 | gain dérivé | ganancia derivativa | guadagno derivativo | Differenzialverstärkung | wzmocnienie różniczkujące | ganho derivativo | 微分ゲイン | 微分增益 | كسب المشتقة |
| droop | ch02 | affaissement | caída | abbassamento | Durchhängen | zwis | desvio residual | ドループ | 静差 | الانخفاض المستمر |
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
| settling time | temps de réponse à 2 % | tiempo de establecimiento | tempo di assestamento | Einschwingzeit | czas ustalania | tempo de acomodação | 整定時間 | 调节时间 | زمن الاستقرار |
| natural logarithm | logarithme népérien | logaritmo natural | logaritmo naturale | natürlicher Logarithmus | logarytm naturalny | logaritmo natural | 自然対数 | 自然对数 | اللوغاريتم الطبيعي |

## Shared s-plane labels (Chapters 7–11 extension, Phase 1)

Short labels the s-plane draws or announces itself (`common:splane.*`), used from Chapter 8 on.

| Term | Definition | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|---|
| double (pole) | a mirror pair that has met on the real axis: two poles at one spot | double | doble | doppio | doppelt | podwójny | duplo | 重根 | 重根 | مزدوج |
| off the map | a pole too far out to draw; the arrow at the edge points at it | hors de la carte | fuera del mapa | fuori dalla mappa | außerhalb der Karte | poza mapą | fora do mapa | 地図の外 | 超出图外 | خارج الخريطة |

"Settles ≈ … s" on the s-plane's settling lines (`common:splane.settles`) uses each
locale's settling-time term (see the Chapter 4 and 6 table).

## Chapters 7–11 terms

Chosen during the Chapters 7–11 extension (`docs/plans/ch07-11-extension.md`), from the nine
translator reports and checked against `public/locales/<lang>/chNN.json` on 2026-09-26 (where a
report and the file disagreed, the file's wording is recorded). "Map" means the term is (also) a
concept-map label in `common.json` (`map.nodes.<id>`). Terms already in "Core terms" (Laplace
transform, s-plane, transfer function, pole, zero, stable, sensor noise, phase/gain margin) are not
repeated. Sources and rejected alternatives per locale are in the translator reports
(`scratch/ch07-11-evidence/glossary/<lang>.md`); the main sources are the ones in `AGENTS.md`.

### Chapter 7: the Laplace transform

| Term (definition) | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| signal: any quantity that changes with time, f(t) | signal | señal | segnale | Signal | sygnał | sinal | 信号 | 信号 | الإشارة |
| probe $e^{-st}$: the fading spinner a signal is multiplied by before taking its area | sonde | sonda | sonda | Sonde | sonda | sonda | プローブ | 探针 | المسبار |
| linearity: areas scale and add | linéarité | linealidad | linearità | Linearität | liniowość | linearidade | 線形性 | 线性 | الخطية |
| integration by parts: moving the slope from f onto the probe, so a derivative becomes s·F − f(0) | intégration par parties | integración por partes | integrazione per parti | partielle Integration | całkowanie przez części | integração por partes | 部分積分 | 分部积分 | التكامل بالتجزئة |
| partial fractions: splitting a fraction into pieces that are in the table | décomposition en éléments simples | fracciones simples | fratti semplici | Partialbruchzerlegung | ułamki proste | frações parciais | 部分分数分解 | 部分分式 | الكسور الجزئية |
| cover-up trick: a piece's coefficient is [s·H] at its pole (A = [s·H] at s = 0) | l'astuce du cache | el truco de tapar | il trucco del coprire | Zuhalte-Trick | sztuczka z zakrywaniem | truque do encobrimento (de Heaviside) | 隠す技（カバーアップ法） | 遮盖法 | حيلة التغطية |
| completing the square: rewriting the bottom as (s + σ)² + ω² to find Chapter 6's wave | compléter le carré | completar el cuadrado | completare il quadrato | quadratische Ergänzung | dopełnianie do kwadratu | completar o quadrado | 平方完成 | 配方 | إكمال المربع |
| starting value f(0) / starting speed f′(0) | valeur de départ / vitesse de départ | valor inicial / velocidad inicial | valore di partenza / velocità di partenza | Startwert, Anfangswert / Startgeschwindigkeit | wartość początkowa / prędkość początkowa | valor inicial / velocidade inicial | 初期値 / 初速度 | 初始值 (once 起始值) / 初始速度 | القيمة الابتدائية / السرعة الابتدائية |
| "sloshes": an area that swings back and forth and never settles (no transform there) | clapoter | ir y venir (phrase) | fare avanti e indietro (phrase) | schwappt hin und her | przelewa się tam i z powrotem | fica balançando | 行ったり来たりする | 来回晃荡 | تتأرجح ذهابًا وإيابًا |

RK4 (the simulator's 1 ms steps that "peek four times") stays "RK4" everywhere; pl/ja add the
Runge–Kutta name in brackets.

### Chapter 8: poles and zeros

| Term (definition) | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| starting from rest: zero initial conditions | partir du repos (conditions initiales nulles) | partir del reposo (condiciones iniciales nulas) | partire da fermo (condizioni iniziali nulle) | Start aus der Ruhe (Anfangswerte null) | start ze spoczynku (zerowe warunki początkowe) | partindo do repouso (condições iniciais nulas) | 静止状態から（初期値ゼロ） | 从静止开始（零初始条件） | البدء من السكون (شروط ابتدائية صفرية) |
| mirror pair $p, \bar p$: two complex poles reflected in the real axis | paire miroir | pareja reflejada | coppia allo specchio | Spiegelpaar | para sprzężona | par espelhado | 鏡像のペア | 镜像对 | الزوج المرآتي |
| dominant pole: the slowest pole, closest to the imaginary axis, which sets how the response ends | pôle dominant | polo dominante | polo dominante | dominanter Pol | biegun dominujący | polo dominante | 代表極 | 主导极点 | القطب المهيمن |
| peak time π/ω (the word inside $t_{\text{…}}$) | pic | pico | picco | Spitze | szczyt | pico | peak (untranslated, see open questions) | 峰值 | الذروة |
| envelope: the fading curve $e^{\sigma t}$ the swings stay inside | enveloppe | envolvente | inviluppo | Hüllkurve | obwiednia | envoltória | 包絡線 | 包络 | الغلاف |
| first push mg + Kp·Δr: the thrust asked for the instant the setpoint jumps | première poussée | primer empujón | prima spinta | erster Schub | pierwsze pchnięcie | empurrão inicial | 最初の一押し | 第一下推力 | الدفعة الأولى |
| thrust budget: the circle of poles whose first push fits in 20 N | budget de poussée | presupuesto de empuje | budget di spinta | Schubbudget | budżet ciągu | orçamento de empuxo | 推力の予算 | 推力预算 | ميزانية الدفع |
| rule of thumb 4/\|σ\|: settling time from the slowest pole's real part | règle empirique | regla práctica | regola pratica | Faustregel | reguła kciuka | regra prática | 目安 | 经验法则 | قاعدة تقريبية |
| motor limits: the motors can only push between 0 and 20 N; a command outside is cut off (map `limits`; vocab "motor limit (saturation)") | limites des moteurs | límites del motor | limiti dei motori | Motorgrenzen | ograniczenia silników | limites do motor | モーター限界 | 电机限制 | حدود المحرك |

### Chapter 9: PID

| Term (definition) | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| integral action / the pile: the part of the controller that pushes in proportion to the accumulated past error (quiz: "integral term") | le tas (terme intégral) | el montón (término integral) | la pila (termine integrale) | der Haufen (Integralterm, Integralanteil) | stos (składnik całkujący) | a pilha (termo integral) | 積み重ね（積分項） | 误差堆（积分项） | الكومة (حد التكامل) |
| integrator time constant τ_I ≈ Kp/Ki: how long the pile takes to get 63% of the way (plain "time constant" everywhere; not the PID textbook's T_i) | constante de temps | constante de tiempo | costante di tempo | Zeitkonstante | stała czasowa | constante de tempo | 時定数 | 时间常数 | الثابت الزمني |
| Routh–Hurwitz criterion: a test on the coefficients that tells whether all poles are in the left half | critère de Routh–Hurwitz | criterio de Routh–Hurwitz | criterio di Routh–Hurwitz | Routh-Hurwitz-Kriterium | kryterium Routha–Hurwitza | critério de Routh–Hurwitz | ラウス・フルビッツの安定判別法 | 劳斯–赫尔维茨判据 | معيار روث–هورويتز |
| derivative kick: a thrust spike from taking the slope of an error that jumps | à-coup de dérivée | patada derivativa | calcio derivativo | D-Stoß | szarpnięcie różniczkujące | chute derivativo | 微分キック | 微分冲击 | ركلة المشتقة |
| derivative on measurement: taking D from the measured height instead of the error | prendre D sur la mesure | D a partir de la medida | D dalla misura | D von der Messung | D z pomiaru | D da medição | 測定値微分（微分先行型） | 从测量值中取 D | المشتقة من القياس |
| derivative filter τ_f: a first-order smoothing lag on the reading before taking its slope | filtre de la dérivée | filtro de la derivada | filtro della derivata | Ableitungsfilter | filtr D | filtro derivativo | 微分フィルター | 微分滤波器 | مرشح المشتقة |
| integrator windup / anti-windup: the pile growing while the motors are pinned, and the fix of pausing it | emballement de l'intégrateur / anti-emballement | windup del integrador / anti-windup | accumulo dell'integratore (windup) / anti-windup | Integrator-Windup / Anti-Windup | nasycenie całkowania (windup) / anti-windup | windup do integrador / anti-windup | 積分器のワインドアップ / アンチワインドアップ | 积分饱和 / 抗积分饱和 | تراكم التكامل / مانع تراكم التكامل |
| motors pinned (saturated): the command sitting at 0 N or 20 N, with no room left to correct | moteurs en butée | motores clavados | motori inchiodati | Motoren am Anschlag | silniki na ograniczeniu | motores no limite | （限界に）張り付く | 电机顶在极限上 | المحركات مثبتة عند حد |
| (near) pole–zero cancellation: a zero close to a pole, so that mode barely shows | un zéro qui compense presque un pôle | casi se cancelan | quasi si cancellano | heben sich fast auf | prawie się skracają | quase se cancelam | 極零相殺 | 零极点对消 | يكاد يلغي أحدهما الآخر |
| ringing: still swinging (stable, but the swings die slowly) | il oscille encore | todavía oscila | oscilla ancora | schwingt immer noch | wciąż się kołysze (dzwonienie) | ainda está balançando | まだ揺れている | 还在摆 | لا تزال تتأرجح |
| chatter / jitter: thrust shaking from noise through D / the sensor reading's random wobble (ch11 says "jitter", not "seed") | crépitement / tremblement | vibración / temblor | tremolio / tremolio | Rattern / Zittern | terkot / drżenie | tremedeira / tremor | ガタガタ (ch09), ざわつき (ch11) / ふらつき (ch09), ゆらぎ (ch11) | 抖动 (乱颤 once) / 抖动 | الارتجاف / الاهتزاز |

### Chapter 10: frequency response

| Term (definition) | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| frequency response: how much a system scales and delays a sine wave at each wiggle speed | réponse en fréquence | respuesta en frecuencia | risposta in frequenza | Frequenzgang | charakterystyka częstotliwościowa | resposta em frequência | 周波数応答 | 频率响应 | الاستجابة الترددية |
| Bode plot: the frequency response drawn as gain and phase against wiggle speed | diagramme de Bode | diagrama de Bode | diagramma di Bode | Bode-Diagramm | charakterystyki Bodego (map: wykres Bodego) | diagrama de Bode | ボード線図 | 波特图 | مخطط بود |
| Map `bode`: "frequency response (Bode plot)" | réponse en fréquence (diagramme de Bode) | respuesta en frecuencia (diagrama de Bode) | risposta in frequenza (diagramma di Bode) | Frequenzgang (Bode-Diagramm) | charakterystyka częstotliwościowa (wykres Bodego) | resposta em frequência (diagrama de Bode) | 周波数応答（ボード線図） | 频率响应（波特图） | الاستجابة الترددية (مخطط بود) |
| wiggle speed ω | vitesse d'oscillation | velocidad de oscilación | velocità di oscillazione | Wackeltempo | prędkość wahań | velocidade da oscilação | 揺れの速さ | 摆动速度 | سرعة الاهتزازة |
| smoother: the shower's first-order lag (τ = 1 s); shrinks and delays fast wiggles, never past 90°. The one Ch 10 word (replaces "thermal response/lag", "mixing") | lisseur | suavizador | smussatore | Glätter | wygładzacz | suavizador | なまし（一次遅れ） | 平滑器 | المُنعِّم |
| pure delay: the pipe's travel time, same shape later | retard pur | retardo puro | ritardo puro | (reine) Totzeit | czyste opóźnienie | atraso puro (ch11: tempo morto) | むだ時間 | 纯延迟 | التأخير الزمني الخالص |
| share of a wiggle $L/T$: the fraction of one period a delay covers; × 360° gives the phase lag | fraction d'oscillation | fracción de oscilación | frazione di oscillazione | Anteil eines Wacklers | ułamek wahnięcia | fração da oscilação | 揺れ1回に占める割合 | 占一次摆动的比例 | حصة من الاهتزازة |
| pile of a wiggle: what an I controller does to a wiggle: lags it 90°, 1/ω as big | le tas d'une oscillation | el montón de una oscilación | la pila di un'oscillazione | der Haufen eines Wacklers | stos z wahnięcia | a pilha de uma oscilação | 揺れの積み重ね | 摆动的那堆面积 | كومة الاهتزازة |
| speed hand / position hand: knob turned at a speed ∝ error (I) vs. put at a spot ∝ error (P) | main vitesse / main position | mano de velocidad / mano de posición | mano a velocità / mano a posizione | Tempo-Hand / Stellungs-Hand | ręka prędkościowa / ręka położeniowa | mão de velocidade / mão de posição | 速さの手 / 位置の手 | 速度手 / 位置手 | يد السرعة / يد الموضع |
| squashed ruler: the course's word for a logarithmic axis (each ×10 is one equal step) | la règle écrasée | la regla aplastada | il righello schiacciato | das gestauchte Lineal | ściśnięta linijka | régua espremida | つぶした物差し | 压扁的尺子 | المسطرة المضغوطة |
| loop gain: size out ÷ size in once around the loop (same "gain" word as the controller's gain) | gain de boucle | ganancia del lazo | guadagno d'anello | Kreisverstärkung | wzmocnienie pętli | ganho de malha | ループゲイン | 回路增益 | كسب الحلقة |
| −180° speed / gain-of-1 speed: where the loop phase is −180° / where the loop gain is 1 (phase and gain crossover; ch11 phrases crossover this way too, never names it) | vitesse du −180° / vitesse de gain 1 | velocidad de −180° / velocidad de ganancia 1 | velocità dei −180° / velocità di guadagno 1 | −180°-Tempo / Tempo mit Kreisverstärkung 1 | prędkość −180° / prędkość wzmocnienia 1 | velocidade de −180° / velocidade de ganho 1 | −180°の速さ / ゲイン1の速さ | −180° 摆动速度 / 增益为 1 的摆动速度 | سرعة −180° / سرعة الكسب 1 |
| hunting: a steady self-sustained oscillation of a loop at its edge (HUD: "hunting period") | pompage, pomper (période de pompage) | oscilar sin parar (periodo de la oscilación sostenida) | pendolamento, pendolare (periodo del pendolamento) | pendeln (Pendelperiode) | huśtanie się (okres huśtania) | caçar (período da caça) | ハンチング | 自激振荡 | التذبذب الذاتي |
| phase lead: reacting earlier (P or D mixed into I) gives back phase | avance de phase | adelanto de fase | anticipo di fase | Phasenvorsprung | wyprzedzenie fazowe | avanço de fase | 位相進み | 相位超前 | تقدّم الطور |
| delay margin: how many seconds longer the delay could get before the loop hunts | marge de retard | margen de retardo | margine di ritardo | Totzeitreserve | zapas opóźnienia | margem de atraso | 遅れ余裕 | 延迟裕度 | هامش التأخير |

Loop symbol $G_{\circ}(s)$ (the trip once around the loop, controller × shower; chosen over $L(s)$
because $L$ is the delay): maths identical in every locale.

### Chapter 11: the final mission

| Term (definition) | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| motor lag: the thrust asked for arrives a moment later; a first-order lag with time constant τm (map `motorlag`) | retard des moteurs | retraso de los motores | ritardo dei motori | Motorverzögerung | bezwładność silników | atraso do motor | モーターの遅れ | 电机滞后 | تأخر المحركات |
| asked for / delivered: the thrust command before / after the motors | demandée / fournie | pedido / entregado | chiesta / fornita | verlangt / geliefert | żądany / dostarczony | pedido / entregue | 指令 / 実際 | 要求的推力 / 实际给出的推力 | المطلوب / المُقدَّم |
| clipping: a command cut off at 0 or 20 N | écrêter (écrêté) | recortar (recortado) | tagliare (tagliata) | abschneiden (abgeschnitten) | obcinać (obcięty) | cortar (cortado) | 頭打ち | 截断 (限幅 once in ch08) | القصّ (مقصوص) |
| fast vs calm: quick arrival vs. quiet motors under sensor noise (map `tradeoff`) | rapide ou calme | rápido o tranquilo | veloce o calmo | schnell oder ruhig | szybko czy spokojnie | rápido ou calmo | 速さか落ち着きか | 快还是稳 | السرعة أم الهدوء |
| gust | rafale | ráfaga | raffica | Böe | podmuch | rajada | 突風 | 一阵风 | عصفة |
| root locus (what's next) | lieu des racines | lugar de las raíces | luogo delle radici | Wurzelortskurve | linie pierwiastkowe (root locus) | lugar das raízes | 根軌跡 | 根轨迹 | المحل الهندسي للجذور |
| state-space control (what's next) | représentation d'état | control en el espacio de estados | controllo nello spazio degli stati | Zustandsraumregelung | sterowanie w przestrzeni stanów | controle no espaço de estados | 状態空間制御 | 状态空间控制 | التحكم في فضاء الحالة |

Notes:
- Keep "gain" in Ch 10 the same word as the controller's gain (the chapter says so: size out ÷
  size in).
- The map labels were taken from the words the chapters already use (Ch 8's "motor limits"
  captions, Ch 10's "frequency response"/"Bode plot" sentence, Ch 11's "Motor lag" item and its
  "motors calm" star), so the map and the prose agree. pl keeps "bezwładność silników" because
  Ch 11 uses it and a first-order lag is "człon inercyjny"; the Bode-plot map label says
  "wykres Bodego" where the Ch 10 prose says "charakterystyki Bodego" (shorter in a bubble, same
  meaning).
- "Motor lag" is a first-order lag, not a pure delay: es keeps "retardo" for the pure delay and
  "retraso" for the motors; pt-BR keeps "atraso do motor" apart from "tempo morto"; zh-CN uses 滞后
  (lag) not 延迟 (delay).
- es/it: the "critical" regime is the adjectival form ("con amortiguamiento crítico",
  "a smorzamento critico") so it reads right both as a readout and inside a sentence.
- Long map labels wrap by themselves at spaces (and after "-" or "/"). Japanese and Chinese
  labels have no spaces, so they carry an explicit "\n" where a break is needed.
- `poles.off_one` / `off_other` (ch11): pl, ar, es, it word `off_other` as "(fast poles past the
  left edge: {n}.)" so it works for any count.

Shared underdamped / critically damped / overdamped labels (`common:regime.*`, since the Ch 7–11
pass; first used in ch06):

| fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|
| sous-amorti / amortissement critique / sur-amorti | subamortiguado / con amortiguamiento crítico / sobreamortiguado | sottosmorzato / a smorzamento critico / sovrasmorzato | unterdämpft / kritisch gedämpft / überdämpft | niedotłumiony / tłumiony krytycznie / przetłumiony | subamortecido / criticamente amortecido / superamortecido | 不足減衰 / 臨界減衰 / 過減衰 | 欠阻尼 / 临界阻尼 / 过阻尼 | تحت التخميد / تخميد حرج / فوق التخميد |

## Cast gender and address

| Locale | Mika | June | Theo | Reader |
|---|---|---|---|---|
| fr | neutral phrasing (no gendered first-person adjective in ch10–11) | neutral phrasing | neutral phrasing | tu; « ·e » only where earlier chapters use it |
| es | neutral phrasing | neutral phrasing | masculine | tú, neutral where possible ("¿Te has atascado?") |
| it | masculine | feminine | masculine | tu, masculine default where agreement is unavoidable |
| de | not needed (first-person past has no gender; no pronouns added) | same | er | du |
| pl | feminine | feminine | masculine | neutral where possible; group lines masculine-personal plural |
| pt-BR | neutral phrasing | neutral phrasing | masculine | você, neutral ("Você já faz engenharia de controle") |
| ja | 私 | 私 | 僕 | UI あなた; characters to the reader 君 |
| zh-CN | no pronoun | no pronoun | 他 | 你 |
| ar | masculine | feminine | masculine | masculine singular generic; plural where a line is not for June alone |

## Settled decisions (Chapters 7–11 pass)

Each was applied to every file of that locale and re-checked in the locale files on 2026-09-26.
Deliberate splits are marked; don't "fix" them.

- **Droop vs. steady-state error.** ja: droop ドループ everywhere; 定常偏差 only for the general
  concept (map `sserror`, the two ch02 lines naming both). zh-CN: droop 静差 everywhere (稳态偏差
  gone); 稳态误差 only for the concept. pt-BR: "desvio residual" everywhere (ch09 "queda residual"
  fixed). ar: map `integralaction` now uses الانخفاض المستمر; خطأ الحالة المستقرة only as the formal
  name.
- **Settling time.** fr: noun « temps de réponse à 2 % » (short « temps de réponse »); « temps de
  stabilisation » gone. *Deliberate:* the verb « se stabiliser » / « stabilisé » stays in prose,
  status lines and `common:splane.settles`. es: noun "tiempo de establecimiento"; "estabilización"
  and "asentamiento" gone. *Deliberate:* the verb "estabilizarse / se estabiliza" stays (prose,
  `common:splane.settles`, ch11 "sin estabilizar"). zh-CN: 调节时间 everywhere; casual 稳定下来 is
  deliberate. pt-BR: "tempo de acomodação" and acomodar(-se) for settling labels; "estabilizar" for
  plain calming down.
- **Overshoot (pt-BR):** "sobressinal"; the noun "ultrapassagem" is gone; the verb "ultrapassa o
  alvo" stays in prose where English uses the verb.
- **"Map of s" before Ch 7:** zh-CN s 的地图 (ch05 `widgets.smap.title`, early s 平面 fixed);
  pt-BR "o mapa de s" in ch05/ch06; ja sの地図 (マップ → 地図, including `common:splane.offMap`
  地図の外).
- **Error.** de *deliberate:* "Regelabweichung" in vocabulary, legends, map and `common.json`,
  "Fehler" in prose and dialogue (ch01 introduces "Regelabweichung … kurz: der Fehler"). ja: 偏差
  for control error; 誤差 only for numerical rounding (ch07).
- **ja:** controller コントローラー, sensor センサー, motor モーター (long-vowel forms); block
  diagram ブロック線図; knob ノブ in ch10; ch06 polite paragraph rewritten in plain style.
- **ar:** block diagram المخطط الكتلي (المخطط الصندوقي gone); sensor المستشعر (الحساس gone); gain
  الكسب (الربح gone); Bernoulli ياكوب (only spelling left); mirror pair الزوج المرآتي (المرآوي unified).
- **fr *deliberate:*** « régulateur de vitesse » in the ch01 cruise-control diagram (the everyday
  name of the device); « correcteur » everywhere else. it does the same with "regolatore di
  velocità".
- **de:** modes "Modus / Modi" ("Moden" gone). *Deliberate:* "offener Regelkreis" is the term;
  "Plan ohne Rückkopplung" is the ch01 prose paraphrase for "open-loop plan".
- **pl:** asked-for thrust „żądany" (not „zadany", which clashes with „wartość zadana").
- **One Ch 10 word for the smoother** in every locale; "thermal response/lag" and "mixing" are gone.
- **Cast gender:** recorded per locale in "Cast gender and address" above.

## Open terminology questions

Still open after the Chapters 7–11 pass. Settle each with a native reviewer who knows control
engineering, then fix every string and move the entry to "Settled decisions".

**All locales**
- `ch08:plays.dominant.t` ("time, seconds") must stay English: the validator treats the key `t` as a
  control field. Rename the English key (e.g. `time`) and translate it.
- Slider accessible names in ch11 read raw TeX ("K_p", "D filter \tau_f").

**Mismatches between reports and files** (the file wins; recorded above)
- de: report says "ausgehend vom Ruhezustand"; ch08 vocab says „Start aus der Ruhe (Anfangswerte
  null)".
- es/pt-BR: reports give "derivada de la medida" / "derivada sobre a medição" and
  "cancelamento polo-zero"; files say "D a partir de la medida" / "D da medição" and "casi se
  cancelan" / "quase se cancelam".
- ja: the report has no ch08 terms; the file uses 代表極 for dominant pole (textbook term, but the
  recap calls it 親分) and 指令 / 実際 for asked for / delivered.

**fr**
- « pompage » for hunting (standard, glossed once, maybe unknown to beginners).
- Coinages to check: « lisseur », « la règle écrasée », « main vitesse / main position »,
  « fraction d'oscillation », « vitesse du −180° » / « vitesse de gain 1 ».
- « retard des moteurs » (a first-order lag) vs. « retard pur »: is the contrast clear?
- Colloquial: « raconte des bobards », « coup de pied aux fesses ».

**es**
- "fracciones simples" vs. "fracciones parciales" (Latin-American readers may prefer the latter).
- Hunting as "oscila sin parar" / "periodo de la oscilación sostenida" (label length at 375 px);
  "abismo abajo"; "mentirijillas".
- ch10 `sections.1.blocks.1` says "retardo puro" and then "ese retraso" in the same paragraph,
  although "retraso" is reserved for motor lag.

**it**
- "lo smussatore" (coinage; "filtro" is taken by the D filter); "pendolamento" for hunting;
  "calcio derivativo" (many courses keep "derivative kick").
- One word, "tremolio", for both chatter and jitter.
- The ch10 octave pun ("volte uguali, non più uguali"); percent spacing is mixed ("63 %" vs "21%").

**de**
- f(0) is both "Startwert" and "Anfangswert" in ch07 (unify to "Anfangswert"?).
- "der Glätter" (coinage; alternative "Glättung"); "Modi" vs. textbook "Moden/Eigenbewegungen";
  "Steuerung" vs. "offener Regelkreis" as the main open-loop term.
- ch09 „kein Fehler in unserer Einstellung" uses "Fehler" as "bug" next to "Fehler" = error.
- Gendered pair in `ch11:widgets.mission.gold` („Regelungstechnikerin / Regelungstechniker").
- HUD lengths at 375 px: "−180°-Tempo", "Pendelperiode", "Amplitudenreserve", "Spitze verlangt".

**pl**
- Coinages/colloquial: „sztuczka z zakrywaniem", „dzwonienie", „reguła kciuka", „budżet ciągu",
  „ściśnięta linijka", „przebrane tłumienie", „kop w tyłek", „przestrzeliwuje" (vs. the term
  „przeregulowanie").
- „{g} raza większe" after fractions in ch10 plays; unit wording „niutony na metr·sekundę".

**pt-BR**
- Coinages: orçamento de empuxo, empurrão inicial, régua espremida, suavizador, girador, "caçar"
  for hunting, "fica balançando", "gambiarra" (ch07, maybe too colloquial).
- "desvio" is both the side trip (`common:sideTrip`) and "desvio residual" (droop).
- Decimals in maths: ch01/ch02 `tex` still use dots (4.9, 0.5), later chapters `{,}`.
- `common:splane.settles` says "estabiliza ≈ {t} s" although settling labels use acomodar.
- Kept English: "playground", "checklist".

**ja**
- ch08 `sections.1.blocks.14.blocks.1.tex` is untranslated: `t_{\text{peak}}`,
  `\text{overshoot}` (should be オーバーシュート and a Japanese peak-time label).
- Chatter and jitter change words between chapters: ガタガタ / ふらつき (ch09) vs. ざわつき / ゆらぎ
  (ch11). Pick one pair.
- なまし for the smoother (maybe unfamiliar to students; alternative 一次遅れ throughout);
  隠す技（カバーアップ法）; ch07 was retranslated as a whole and needs a full read.
- Polite です/ます sentences remain in ch00 (13), ch01 (5), ch03 (9), common (2); ch00 uses ノブ,
  ハンドル and つまみ for the same knob.
- Prose keeps "25 %" with a space; a reviewer may prefer "25%".

**zh-CN**
- One word, 抖动, for both chatter and jitter (乱颤 once in ch09).
- 截断 for clipping vs. 限幅 once in ch08; 遮盖法 (not a termonline entry); 波特图 vs. 伯德图;
  自激振荡 for hunting (more technical than the English).
- Mirror pair 镜像对 with prose variants 镜像双胞胎 / 镜像伙伴: check they read as one concept.

**ar**
- Numerals: Western (0–9, as now, `%` without a space) or Eastern Arabic (٠–٩); agree on one with
  an Arabic reviewer.
- Coinages: المُنعِّم (smoother), المسطرة المضغوطة, "هامش الطور تخميدٌ متنكر", "ركلة مفاجئة".
- RTL layout of the Arabic `\text{}` inside the ch10 formula `\frac{1}{i\omega}: …`; arrow direction
  in ch01's recap chain (ch10 uses ←).
- Unit wording in play labels ("بالنيوتن لكل متر·ثانية").
