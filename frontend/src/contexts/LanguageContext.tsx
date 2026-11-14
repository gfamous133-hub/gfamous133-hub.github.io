import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Language = "sw" | "en" | "fr" | "ar" | "zh" | "es" | "pt";

export const languageOptions: { code: Language; label: string }[] = [
  { code: "sw", label: "Kiswahili" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
];

const messages = {
  sw: {
    admin:"Dashibodi ya Admin", signIn:"Ingia kwa Pi", signOut:"Toka", testNotification:"Tuma taarifa ya majaribio", language:"Lugha",
    welcome:"Soko la kuunganisha wanunuzi na wauzaji wa dhahabu na madini mengine.", tagline:"Tanzania | Nunua kwa taarifa sahihi. Uza kwa uwazi.",
    listings:"Matangazo ya Madini", approvedOnly:"Hapa yanaonekana matangazo yaliyoidhinishwa pekee.", refresh:"Onyesha upya", loading:"Inapakia...", loadingListings:"Inapakia matangazo...",
    noListings:"Bado hakuna matangazo yaliyoidhinishwa. Unaweza kutuma tangazo lako hapa chini.", filters:"Tafuta na Chuja Madini", mineralType:"Aina ya madini", mineralTypePlaceholder:"Mfano: Gold, Tanzanite, Copper", location:"Eneo",
    minWeight:"Uzito kuanzia (gramu)", maxWeight:"Uzito hadi (gramu)", currency:"Sarafu ya bei", allCurrencies:"Sarafu zote", minPrice:"Bei kuanzia", maxPrice:"Bei hadi",
    minPricePlaceholder:"Bei ya chini", maxPricePlaceholder:"Bei ya juu", clearFilters:"Futa vichujio", results:"Matokeo", of:"kati ya", listingsWord:"matangazo",
    noMatches:"Hakuna tangazo linalolingana na utafutaji wako.", noImage:"Hakuna picha", weight:"Uzito", price:"Bei", contact:"Mawasiliano", report:"Ripoti tangazo",
    reportReason:"Eleza sababu ya kuripoti tangazo hili:", reportThanks:"Asante. Ripoti yako imepokelewa kwa ukaguzi.", reportFailed:"Imeshindikana kutuma ripoti. Tafadhali jaribu tena.",
    submitListing:"Weka Tangazo Lako", sellerIntro:"Wauzaji wanaweza kutuma taarifa za madini yao. Tangazo litakaguliwa kabla ya kuonekana kwa wanunuzi.",
    signInToSubmit:"Ingia kwa kutumia Pi ili uweze kutuma tangazo.", description:"Maelezo ya madini", mineralDetailsPlaceholder:"Eleza hali na taarifa za madini...",
    locationPlaceholder:"Mfano: Nyamongo, Mara, Tanzania", weightPlaceholder:"Weka uzito", weightUnit:"Kipimo cha uzito", kilogram:"Kilogram (kg)", gram:"Gram (g)",
    pricePlaceholder:"Weka bei", tzs:"Shilingi ya Tanzania (TZS)", usd:"Dola ya Marekani (USD)", sellerContact:"Mawasiliano ya muuzaji",
    contactPlaceholder:"Namba ya simu au mawasiliano", chooseImages:"Chagua picha kutoka Gallery ya simu", imageRules:"Chagua hadi picha 5. JPG, PNG au WebP. Kila picha isiwe kubwa kuliko MB 5.",
    selectedImages:"Picha ulizochagua", removeImages:"Ondoa picha", imageLinks:"Viungo vya picha (si lazima)", imageLinksPlaceholder:"Bandika kiungo cha picha hapa. Kiungo kimoja kwa kila mstari.",
    imageLinkRules:"Jumla ya picha kutoka Gallery na viungo visizidi 5. Viungo lazima viwe vya HTTPS.", submit:"Tuma Tangazo",
    uploadingSubmitting:"Inapakia picha na kutuma tangazo...", submitted:"Tangazo lako limetumwa kwa mafanikio. Litasubiri ukaguzi kabla ya kuonekana sokoni.",
    signInRequired:"Tafadhali ingia kwa kutumia Pi kwanza.", fillMineralDescription:"Tafadhali jaza aina ya madini na maelezo.", fillLocationContact:"Tafadhali jaza eneo na mawasiliano.",
    invalidWeight:"Weka uzito sahihi unaozidi sifuri.", invalidPrice:"Weka bei sahihi inayozidi sifuri.", maxFiveImages:"Chagua picha zisizozidi 5.",
    imageTypes:"Tumia picha za JPG, PNG au WebP pekee.", imageSize:"Kila picha lazima isiwe kubwa kuliko MB 5.", httpsOnly:"Viungo vyote vya picha lazima vianze na https://",
    invalidImageLink:"Kuna kiungo cha picha kisicho sahihi.", uploadPermission:"Imeshindikana kupata ruhusa ya kupakia picha.", uploadUnavailable:"Huduma ya kupakia picha haijawekwa sawa kwenye server.",
    sessionExpired:"Session yako imeisha. Ingia tena kwa Pi.", footerContact:"Mawasiliano", privacy:"Sera ya Faragha", terms:"Masharti ya Matumizi",
    signInPrompt:"Unahitaji kuingia kwanza.", close:"Funga", signInButton:"Ingia",
    pending:"Matangazo yanayosubiri", approved:"Matangazo yaliyoidhinishwa", noPending:"Hakuna tangazo linalosubiri ukaguzi kwa sasa.", noApproved:"Hakuna tangazo lililoidhinishwa kwa sasa.",
    moderation:"Usimamizi wa matangazo ya madini.", backToMarket:"Rudi sokoni", approve:"Idhinisha", reject:"Kataa", delete:"Futa tangazo",
    approving:"Inahifadhi...", deleting:"Inafuta...", approveConfirm:"Una uhakika unataka kuidhinisha tangazo hili?", rejectConfirm:"Una uhakika unataka kukataa tangazo hili?",
    deleteConfirm:"TAHADHARI: Unataka kufuta kabisa tangazo hili?", approvedMessage:"Tangazo limeidhinishwa.", rejectedMessage:"Tangazo limekataliwa.",
    deletedMessage:"Tangazo lililochaguliwa limefutwa.", adminOnly:"Huna ruhusa. Admin pekee ndiye anayeruhusiwa.", piLoginRequired:"Tafadhali ingia kwa akaunti yako ya Pi.",
    pendingLoadFailed:"Imeshindikana kupakia matangazo yanayosubiri.", approvedLoadFailed:"Imeshindikana kupakia matangazo yaliyoidhinishwa.", decisionFailed:"Imeshindikana kuhifadhi uamuzi. Jaribu tena.",
    deleteFailed:"Imeshindikana kufuta tangazo. Jaribu tena.", noSellerName:"Haijatajwa", seller:"Muuzaji",
  },
  en: {
    admin:"Admin Dashboard", signIn:"Sign in with Pi", signOut:"Sign out", testNotification:"Send Test Notification", language:"Language",
    welcome:"A marketplace connecting buyers and sellers of gold and other minerals.", tagline:"Tanzania | Buy with accurate information. Sell transparently.",
    listings:"Mineral Listings", approvedOnly:"Only approved listings appear here.", refresh:"Refresh", loading:"Loading...", loadingListings:"Loading listings...",
    noListings:"There are no approved listings yet. You can submit yours below.", filters:"Search and Filter Minerals", mineralType:"Mineral type", mineralTypePlaceholder:"Example: Gold, Tanzanite, Copper", location:"Location",
    minWeight:"Minimum weight (grams)", maxWeight:"Maximum weight (grams)", currency:"Price currency", allCurrencies:"All currencies", minPrice:"Minimum price", maxPrice:"Maximum price",
    minPricePlaceholder:"Lowest price", maxPricePlaceholder:"Highest price", clearFilters:"Clear filters", results:"Results", of:"of", listingsWord:"listings",
    noMatches:"No listings match your search.", noImage:"No image", weight:"Weight", price:"Price", contact:"Contact", report:"Report listing",
    reportReason:"Explain why you are reporting this listing:", reportThanks:"Thank you. Your report has been received for review.", reportFailed:"Could not submit the report. Please try again.",
    submitListing:"Submit Your Listing", sellerIntro:"Sellers can submit mineral details. Listings are reviewed before they become visible to buyers.",
    signInToSubmit:"Sign in with Pi to submit a listing.", description:"Mineral description", mineralDetailsPlaceholder:"Describe the mineral and provide relevant details...",
    locationPlaceholder:"Example: Nyamongo, Mara, Tanzania", weightPlaceholder:"Enter weight", weightUnit:"Weight unit", kilogram:"Kilogram (kg)", gram:"Gram (g)",
    pricePlaceholder:"Enter price", tzs:"Tanzanian Shilling (TZS)", usd:"US Dollar (USD)", sellerContact:"Seller contact",
    contactPlaceholder:"Phone number or contact details", chooseImages:"Choose images from your phone gallery", imageRules:"Choose up to 5 images. JPG, PNG or WebP. Each image must be 5 MB or smaller.",
    selectedImages:"Selected images", removeImages:"Remove images", imageLinks:"Image links (optional)", imageLinksPlaceholder:"Paste image links here, one link per line.",
    imageLinkRules:"Gallery images and links combined must not exceed 5. Links must use HTTPS.", submit:"Submit Listing",
    uploadingSubmitting:"Uploading images and submitting listing...", submitted:"Your listing was submitted successfully. It will be reviewed before appearing in the marketplace.",
    signInRequired:"Please sign in with Pi first.", fillMineralDescription:"Please enter the mineral type and description.", fillLocationContact:"Please enter the location and contact details.",
    invalidWeight:"Enter a valid weight greater than zero.", invalidPrice:"Enter a valid price greater than zero.", maxFiveImages:"Choose no more than 5 images.",
    imageTypes:"Only JPG, PNG or WebP images are allowed.", imageSize:"Each image must be 5 MB or smaller.", httpsOnly:"All image links must start with https://",
    invalidImageLink:"An image link is invalid.", uploadPermission:"Could not obtain permission to upload images.", uploadUnavailable:"Image upload service is not configured correctly on the server.",
    sessionExpired:"Your session has expired. Sign in with Pi again.", footerContact:"Contact", privacy:"Privacy Policy", terms:"Terms of Service",
    signInPrompt:"You need to sign in first.", close:"Close", signInButton:"Sign in",
    pending:"Pending listings", approved:"Approved listings", noPending:"There are no listings waiting for review.", noApproved:"There are no approved listings.",
    moderation:"Mineral listing moderation.", backToMarket:"Back to marketplace", approve:"Approve", reject:"Reject", delete:"Delete listing",
    approving:"Saving...", deleting:"Deleting...", approveConfirm:"Are you sure you want to approve this listing?", rejectConfirm:"Are you sure you want to reject this listing?",
    deleteConfirm:"WARNING: Are you sure you want to permanently delete this listing?", approvedMessage:"Listing approved.", rejectedMessage:"Listing rejected.",
    deletedMessage:"The selected listing was deleted.", adminOnly:"You do not have permission. Admin access is required.", piLoginRequired:"Please sign in with your Pi account.",
    pendingLoadFailed:"Could not load pending listings.", approvedLoadFailed:"Could not load approved listings.", decisionFailed:"Could not save your decision. Please try again.",
    deleteFailed:"Could not delete the listing. Please try again.", noSellerName:"Not provided", seller:"Seller",
  },
  fr: {
    admin:"Tableau de bord administrateur", signIn:"Se connecter avec Pi", signOut:"Se déconnecter", testNotification:"Envoyer une notification test", language:"Langue",
    welcome:"Une place de marché reliant les acheteurs et vendeurs d’or et d’autres minéraux.", tagline:"Tanzanie | Achetez avec des informations fiables. Vendez en toute transparence.",
    listings:"Annonces de minéraux", approvedOnly:"Seules les annonces approuvées apparaissent ici.", refresh:"Actualiser", loading:"Chargement...", loadingListings:"Chargement des annonces...",
    noListings:"Aucune annonce approuvée pour le moment. Vous pouvez publier la vôtre ci-dessous.", filters:"Rechercher et filtrer les minéraux", mineralType:"Type de minéral", mineralTypePlaceholder:"Exemple : Gold, Tanzanite, Copper", location:"Emplacement",
    minWeight:"Poids minimum (grammes)", maxWeight:"Poids maximum (grammes)", currency:"Devise du prix", allCurrencies:"Toutes les devises", minPrice:"Prix minimum", maxPrice:"Prix maximum",
    minPricePlaceholder:"Prix le plus bas", maxPricePlaceholder:"Prix le plus élevé", clearFilters:"Effacer les filtres", results:"Résultats", of:"sur", listingsWord:"annonces",
    noMatches:"Aucune annonce ne correspond à votre recherche.", noImage:"Aucune image", weight:"Poids", price:"Prix", contact:"Contact", report:"Signaler l’annonce",
    reportReason:"Expliquez pourquoi vous signalez cette annonce :", reportThanks:"Merci. Votre signalement a été reçu pour examen.", reportFailed:"Impossible d’envoyer le signalement. Réessayez.",
    submitListing:"Publier votre annonce", sellerIntro:"Les vendeurs peuvent soumettre les détails de leurs minéraux. Les annonces sont vérifiées avant leur publication.",
    signInToSubmit:"Connectez-vous avec Pi pour publier une annonce.", description:"Description du minéral", mineralDetailsPlaceholder:"Décrivez le minéral et ajoutez les détails utiles...",
    locationPlaceholder:"Exemple : Nyamongo, Mara, Tanzanie", weightPlaceholder:"Saisir le poids", weightUnit:"Unité de poids", kilogram:"Kilogramme (kg)", gram:"Gramme (g)",
    pricePlaceholder:"Saisir le prix", tzs:"Shilling tanzanien (TZS)", usd:"Dollar américain (USD)", sellerContact:"Contact du vendeur",
    contactPlaceholder:"Numéro de téléphone ou coordonnées", chooseImages:"Choisir des images dans la galerie du téléphone", imageRules:"Choisissez jusqu’à 5 images JPG, PNG ou WebP. 5 Mo maximum par image.",
    selectedImages:"Images sélectionnées", removeImages:"Supprimer les images", imageLinks:"Liens des images (facultatif)", imageLinksPlaceholder:"Collez les liens des images, un lien par ligne.",
    imageLinkRules:"5 images maximum au total. Les liens doivent utiliser HTTPS.", submit:"Envoyer l’annonce",
    uploadingSubmitting:"Envoi des images et de l’annonce...", submitted:"Votre annonce a été envoyée. Elle sera vérifiée avant sa publication.",
    signInRequired:"Veuillez d’abord vous connecter avec Pi.", fillMineralDescription:"Veuillez saisir le type et la description du minéral.", fillLocationContact:"Veuillez saisir l’emplacement et les coordonnées.",
    invalidWeight:"Saisissez un poids supérieur à zéro.", invalidPrice:"Saisissez un prix supérieur à zéro.", maxFiveImages:"Choisissez 5 images maximum.",
    imageTypes:"Seuls les formats JPG, PNG et WebP sont acceptés.", imageSize:"Chaque image doit faire 5 Mo maximum.", httpsOnly:"Tous les liens d’images doivent commencer par https://",
    invalidImageLink:"Un lien d’image est invalide.", uploadPermission:"Impossible d’obtenir l’autorisation d’envoyer les images.", uploadUnavailable:"Le service d’envoi d’images est mal configuré sur le serveur.",
    sessionExpired:"Votre session a expiré. Reconnectez-vous avec Pi.", footerContact:"Contact", privacy:"Confidentialité", terms:"Conditions d’utilisation",
    signInPrompt:"Vous devez d’abord vous connecter.", close:"Fermer", signInButton:"Se connecter",
    pending:"Annonces en attente", approved:"Annonces approuvées", noPending:"Aucune annonce n’attend actuellement de vérification.", noApproved:"Aucune annonce n’a été approuvée.",
    moderation:"Modération des annonces de minéraux.", backToMarket:"Retour au marché", approve:"Approuver", reject:"Refuser", delete:"Supprimer l’annonce",
    approving:"Enregistrement...", deleting:"Suppression...", approveConfirm:"Voulez-vous vraiment approuver cette annonce ?", rejectConfirm:"Voulez-vous vraiment refuser cette annonce ?",
    deleteConfirm:"ATTENTION : Voulez-vous supprimer définitivement cette annonce ?", approvedMessage:"Annonce approuvée.", rejectedMessage:"Annonce refusée.",
    deletedMessage:"L’annonce sélectionnée a été supprimée.", adminOnly:"Accès refusé. Réservé à l’administrateur.", piLoginRequired:"Connectez-vous avec votre compte Pi.",
    pendingLoadFailed:"Impossible de charger les annonces en attente.", approvedLoadFailed:"Impossible de charger les annonces approuvées.", decisionFailed:"Impossible d’enregistrer la décision. Réessayez.",
    deleteFailed:"Impossible de supprimer l’annonce. Réessayez.", noSellerName:"Non indiqué", seller:"Vendeur",
  },
  ar: {
    admin:"لوحة تحكم المسؤول", signIn:"تسجيل الدخول باستخدام Pi", signOut:"تسجيل الخروج", testNotification:"إرسال إشعار تجريبي", language:"اللغة",
    welcome:"سوق يربط بين مشتري وبائعي الذهب والمعادن الأخرى.", tagline:"تنزانيا | اشترِ بمعلومات دقيقة وبع بشفافية.",
    listings:"إعلانات المعادن", approvedOnly:"تظهر هنا الإعلانات المعتمدة فقط.", refresh:"تحديث", loading:"جارٍ التحميل...", loadingListings:"جارٍ تحميل الإعلانات...",
    noListings:"لا توجد إعلانات معتمدة بعد. يمكنك إرسال إعلانك أدناه.", filters:"ابحث عن المعادن وصفِّ النتائج", mineralType:"نوع المعدن", mineralTypePlaceholder:"مثال: Gold, Tanzanite, Copper", location:"الموقع",
    minWeight:"الحد الأدنى للوزن (غرام)", maxWeight:"الحد الأقصى للوزن (غرام)", currency:"عملة السعر", allCurrencies:"كل العملات", minPrice:"أقل سعر", maxPrice:"أعلى سعر",
    minPricePlaceholder:"أقل سعر", maxPricePlaceholder:"أعلى سعر", clearFilters:"مسح عوامل التصفية", results:"النتائج", of:"من", listingsWord:"إعلانات",
    noMatches:"لا توجد إعلانات تطابق بحثك.", noImage:"لا توجد صورة", weight:"الوزن", price:"السعر", contact:"جهة الاتصال", report:"الإبلاغ عن الإعلان",
    reportReason:"اشرح سبب الإبلاغ عن هذا الإعلان:", reportThanks:"شكراً لك. تم استلام البلاغ للمراجعة.", reportFailed:"تعذر إرسال البلاغ. حاول مرة أخرى.",
    submitListing:"أرسل إعلانك", sellerIntro:"يمكن للبائعين إرسال تفاصيل المعادن. تتم مراجعة الإعلانات قبل ظهورها للمشترين.",
    signInToSubmit:"سجّل الدخول باستخدام Pi لإرسال إعلان.", description:"وصف المعدن", mineralDetailsPlaceholder:"صف المعدن وأضف التفاصيل ذات الصلة...",
    locationPlaceholder:"مثال: Nyamongo, Mara, Tanzania", weightPlaceholder:"أدخل الوزن", weightUnit:"وحدة الوزن", kilogram:"كيلوغرام (kg)", gram:"غرام (g)",
    pricePlaceholder:"أدخل السعر", tzs:"شلن تنزاني (TZS)", usd:"دولار أمريكي (USD)", sellerContact:"بيانات اتصال البائع",
    contactPlaceholder:"رقم الهاتف أو بيانات الاتصال", chooseImages:"اختر الصور من معرض الهاتف", imageRules:"اختر حتى 5 صور بصيغ JPG أو PNG أو WebP. الحد الأقصى 5 ميغابايت للصورة.",
    selectedImages:"الصور المحددة", removeImages:"إزالة الصور", imageLinks:"روابط الصور (اختياري)", imageLinksPlaceholder:"الصق روابط الصور، رابطاً واحداً في كل سطر.",
    imageLinkRules:"الحد الأقصى 5 صور إجمالاً. يجب أن تستخدم الروابط HTTPS.", submit:"إرسال الإعلان",
    uploadingSubmitting:"جارٍ رفع الصور وإرسال الإعلان...", submitted:"تم إرسال إعلانك بنجاح. ستتم مراجعته قبل ظهوره في السوق.",
    signInRequired:"يرجى تسجيل الدخول باستخدام Pi أولاً.", fillMineralDescription:"يرجى إدخال نوع المعدن ووصفه.", fillLocationContact:"يرجى إدخال الموقع وبيانات الاتصال.",
    invalidWeight:"أدخل وزناً صحيحاً أكبر من صفر.", invalidPrice:"أدخل سعراً صحيحاً أكبر من صفر.", maxFiveImages:"اختر 5 صور كحد أقصى.",
    imageTypes:"يُسمح فقط بصور JPG أو PNG أو WebP.", imageSize:"يجب ألا يتجاوز حجم كل صورة 5 ميغابايت.", httpsOnly:"يجب أن تبدأ جميع روابط الصور بـ https://",
    invalidImageLink:"أحد روابط الصور غير صالح.", uploadPermission:"تعذر الحصول على إذن لرفع الصور.", uploadUnavailable:"خدمة رفع الصور غير مهيأة بشكل صحيح على الخادم.",
    sessionExpired:"انتهت جلستك. سجّل الدخول باستخدام Pi مجدداً.", footerContact:"اتصل بنا", privacy:"سياسة الخصوصية", terms:"شروط الاستخدام",
    signInPrompt:"يجب تسجيل الدخول أولاً.", close:"إغلاق", signInButton:"تسجيل الدخول",
    pending:"الإعلانات قيد الانتظار", approved:"الإعلانات المعتمدة", noPending:"لا توجد إعلانات بانتظار المراجعة حالياً.", noApproved:"لا توجد إعلانات معتمدة حالياً.",
    moderation:"إدارة إعلانات المعادن.", backToMarket:"العودة إلى السوق", approve:"اعتماد", reject:"رفض", delete:"حذف الإعلان",
    approving:"جارٍ الحفظ...", deleting:"جارٍ الحذف...", approveConfirm:"هل تريد بالتأكيد اعتماد هذا الإعلان؟", rejectConfirm:"هل تريد بالتأكيد رفض هذا الإعلان؟",
    deleteConfirm:"تحذير: هل تريد حذف هذا الإعلان نهائياً؟", approvedMessage:"تم اعتماد الإعلان.", rejectedMessage:"تم رفض الإعلان.",
    deletedMessage:"تم حذف الإعلان المحدد.", adminOnly:"ليس لديك إذن. هذه الميزة للمسؤول فقط.", piLoginRequired:"يرجى تسجيل الدخول بحساب Pi الخاص بك.",
    pendingLoadFailed:"تعذر تحميل الإعلانات قيد الانتظار.", approvedLoadFailed:"تعذر تحميل الإعلانات المعتمدة.", decisionFailed:"تعذر حفظ القرار. حاول مرة أخرى.",
    deleteFailed:"تعذر حذف الإعلان. حاول مرة أخرى.", noSellerName:"غير مذكور", seller:"البائع",
  },
  zh: {
    admin:"管理员面板", signIn:"使用 Pi 登录", signOut:"退出登录", testNotification:"发送测试通知", language:"语言",
    welcome:"连接黄金及其他矿产买家与卖家的市场。", tagline:"坦桑尼亚 | 信息准确，交易透明。",
    listings:"矿产信息", approvedOnly:"这里只显示已审核通过的信息。", refresh:"刷新", loading:"正在加载...", loadingListings:"正在加载信息...",
    noListings:"目前还没有已批准的信息。您可以在下方发布。", filters:"搜索和筛选矿产", mineralType:"矿产类型", mineralTypePlaceholder:"例如：Gold、Tanzanite、Copper", location:"地点",
    minWeight:"最低重量（克）", maxWeight:"最高重量（克）", currency:"价格货币", allCurrencies:"所有货币", minPrice:"最低价格", maxPrice:"最高价格",
    minPricePlaceholder:"最低价格", maxPricePlaceholder:"最高价格", clearFilters:"清除筛选", results:"结果", of:"共", listingsWord:"条信息",
    noMatches:"没有符合搜索条件的信息。", noImage:"暂无图片", weight:"重量", price:"价格", contact:"联系方式", report:"举报信息",
    reportReason:"请说明举报此信息的原因：", reportThanks:"谢谢，您的举报已收到并将接受审核。", reportFailed:"无法提交举报，请重试。",
    submitListing:"发布矿产信息", sellerIntro:"卖家可以提交矿产详情。信息经过审核后才会向买家显示。",
    signInToSubmit:"请使用 Pi 登录后发布信息。", description:"矿产描述", mineralDetailsPlaceholder:"描述矿产并提供相关详情...",
    locationPlaceholder:"例如：Nyamongo, Mara, Tanzania", weightPlaceholder:"输入重量", weightUnit:"重量单位", kilogram:"千克（kg）", gram:"克（g）",
    pricePlaceholder:"输入价格", tzs:"坦桑尼亚先令（TZS）", usd:"美元（USD）", sellerContact:"卖家联系方式",
    contactPlaceholder:"电话号码或联系方式", chooseImages:"从手机图库选择图片", imageRules:"最多选择5张 JPG、PNG 或 WebP 图片。每张不超过5 MB。",
    selectedImages:"已选图片", removeImages:"移除图片", imageLinks:"图片链接（可选）", imageLinksPlaceholder:"粘贴图片链接，每行一个。",
    imageLinkRules:"图库图片和链接总数最多5张。链接必须使用 HTTPS。", submit:"提交信息",
    uploadingSubmitting:"正在上传图片并提交信息...", submitted:"信息已成功提交，审核通过后才会显示在市场中。",
    signInRequired:"请先使用 Pi 登录。", fillMineralDescription:"请填写矿产类型和描述。", fillLocationContact:"请填写地点和联系方式。",
    invalidWeight:"请输入大于零的有效重量。", invalidPrice:"请输入大于零的有效价格。", maxFiveImages:"最多选择5张图片。",
    imageTypes:"仅支持 JPG、PNG 或 WebP 图片。", imageSize:"每张图片不得超过5 MB。", httpsOnly:"所有图片链接必须以 https:// 开头。",
    invalidImageLink:"图片链接无效。", uploadPermission:"无法获取图片上传权限。", uploadUnavailable:"服务器上的图片上传服务配置不正确。",
    sessionExpired:"登录会话已过期，请重新使用 Pi 登录。", footerContact:"联系方式", privacy:"隐私政策", terms:"服务条款",
    signInPrompt:"请先登录。", close:"关闭", signInButton:"登录",
    pending:"待审核信息", approved:"已批准信息", noPending:"目前没有等待审核的信息。", noApproved:"目前没有已批准的信息。",
    moderation:"矿产信息审核管理。", backToMarket:"返回市场", approve:"批准", reject:"拒绝", delete:"删除信息",
    approving:"正在保存...", deleting:"正在删除...", approveConfirm:"确定要批准此信息吗？", rejectConfirm:"确定要拒绝此信息吗？",
    deleteConfirm:"警告：确定要永久删除此信息吗？", approvedMessage:"信息已批准。", rejectedMessage:"信息已拒绝。",
    deletedMessage:"所选信息已删除。", adminOnly:"您没有权限，只有管理员可以执行此操作。", piLoginRequired:"请使用您的 Pi 账户登录。",
    pendingLoadFailed:"无法加载待审核信息。", approvedLoadFailed:"无法加载已批准信息。", decisionFailed:"无法保存决定，请重试。",
    deleteFailed:"无法删除信息，请重试。", noSellerName:"未提供", seller:"卖家",
  },
  es: {
    admin:"Panel de administración", signIn:"Iniciar sesión con Pi", signOut:"Cerrar sesión", testNotification:"Enviar notificación de prueba", language:"Idioma",
    welcome:"Mercado que conecta a compradores y vendedores de oro y otros minerales.", tagline:"Tanzania | Compra con información precisa. Vende con transparencia.",
    listings:"Anuncios de minerales", approvedOnly:"Aquí solo aparecen los anuncios aprobados.", refresh:"Actualizar", loading:"Cargando...", loadingListings:"Cargando anuncios...",
    noListings:"Todavía no hay anuncios aprobados. Puedes publicar el tuyo abajo.", filters:"Buscar y filtrar minerales", mineralType:"Tipo de mineral", mineralTypePlaceholder:"Ejemplo: Gold, Tanzanite, Copper", location:"Ubicación",
    minWeight:"Peso mínimo (gramos)", maxWeight:"Peso máximo (gramos)", currency:"Moneda del precio", allCurrencies:"Todas las monedas", minPrice:"Precio mínimo", maxPrice:"Precio máximo",
    minPricePlaceholder:"Precio más bajo", maxPricePlaceholder:"Precio más alto", clearFilters:"Borrar filtros", results:"Resultados", of:"de", listingsWord:"anuncios",
    noMatches:"Ningún anuncio coincide con tu búsqueda.", noImage:"Sin imagen", weight:"Peso", price:"Precio", contact:"Contacto", report:"Denunciar anuncio",
    reportReason:"Explica por qué denuncias este anuncio:", reportThanks:"Gracias. Hemos recibido tu denuncia para revisarla.", reportFailed:"No se pudo enviar la denuncia. Inténtalo de nuevo.",
    submitListing:"Publicar tu anuncio", sellerIntro:"Los vendedores pueden enviar los detalles de sus minerales. Los anuncios se revisan antes de mostrarse a los compradores.",
    signInToSubmit:"Inicia sesión con Pi para publicar un anuncio.", description:"Descripción del mineral", mineralDetailsPlaceholder:"Describe el mineral y añade detalles relevantes...",
    locationPlaceholder:"Ejemplo: Nyamongo, Mara, Tanzania", weightPlaceholder:"Introduce el peso", weightUnit:"Unidad de peso", kilogram:"Kilogramo (kg)", gram:"Gramo (g)",
    pricePlaceholder:"Introduce el precio", tzs:"Chelín tanzano (TZS)", usd:"Dólar estadounidense (USD)", sellerContact:"Contacto del vendedor",
    contactPlaceholder:"Número de teléfono o datos de contacto", chooseImages:"Elige imágenes de la galería del teléfono", imageRules:"Elige hasta 5 imágenes JPG, PNG o WebP. Máximo 5 MB por imagen.",
    selectedImages:"Imágenes seleccionadas", removeImages:"Quitar imágenes", imageLinks:"Enlaces de imágenes (opcional)", imageLinksPlaceholder:"Pega los enlaces de las imágenes, uno por línea.",
    imageLinkRules:"Máximo 5 imágenes en total. Los enlaces deben usar HTTPS.", submit:"Enviar anuncio",
    uploadingSubmitting:"Subiendo imágenes y enviando el anuncio...", submitted:"Tu anuncio se ha enviado correctamente. Se revisará antes de aparecer en el mercado.",
    signInRequired:"Inicia sesión con Pi primero.", fillMineralDescription:"Introduce el tipo y la descripción del mineral.", fillLocationContact:"Introduce la ubicación y los datos de contacto.",
    invalidWeight:"Introduce un peso válido mayor que cero.", invalidPrice:"Introduce un precio válido mayor que cero.", maxFiveImages:"Elige como máximo 5 imágenes.",
    imageTypes:"Solo se permiten imágenes JPG, PNG o WebP.", imageSize:"Cada imagen debe pesar 5 MB o menos.", httpsOnly:"Todos los enlaces de imágenes deben comenzar con https://",
    invalidImageLink:"Hay un enlace de imagen no válido.", uploadPermission:"No se pudo obtener permiso para subir imágenes.", uploadUnavailable:"El servicio de imágenes no está bien configurado en el servidor.",
    sessionExpired:"Tu sesión ha caducado. Vuelve a iniciar sesión con Pi.", footerContact:"Contacto", privacy:"Política de privacidad", terms:"Términos del servicio",
    signInPrompt:"Primero debes iniciar sesión.", close:"Cerrar", signInButton:"Iniciar sesión",
    pending:"Anuncios pendientes", approved:"Anuncios aprobados", noPending:"No hay anuncios pendientes de revisión.", noApproved:"No hay anuncios aprobados.",
    moderation:"Moderación de anuncios de minerales.", backToMarket:"Volver al mercado", approve:"Aprobar", reject:"Rechazar", delete:"Eliminar anuncio",
    approving:"Guardando...", deleting:"Eliminando...", approveConfirm:"¿Seguro que quieres aprobar este anuncio?", rejectConfirm:"¿Seguro que quieres rechazar este anuncio?",
    deleteConfirm:"AVISO: ¿Quieres eliminar este anuncio permanentemente?", approvedMessage:"Anuncio aprobado.", rejectedMessage:"Anuncio rechazado.",
    deletedMessage:"Se eliminó el anuncio seleccionado.", adminOnly:"No tienes permiso. Solo el administrador puede hacerlo.", piLoginRequired:"Inicia sesión con tu cuenta Pi.",
    pendingLoadFailed:"No se pudieron cargar los anuncios pendientes.", approvedLoadFailed:"No se pudieron cargar los anuncios aprobados.", decisionFailed:"No se pudo guardar la decisión. Inténtalo de nuevo.",
    deleteFailed:"No se pudo eliminar el anuncio. Inténtalo de nuevo.", noSellerName:"No indicado", seller:"Vendedor",
  },
  pt: {
    admin:"Painel do administrador", signIn:"Entrar com Pi", signOut:"Sair", testNotification:"Enviar notificação de teste", language:"Idioma",
    welcome:"Mercado que conecta compradores e vendedores de ouro e outros minerais.", tagline:"Tanzânia | Compre com informações precisas. Venda com transparência.",
    listings:"Anúncios de minerais", approvedOnly:"Apenas anúncios aprovados aparecem aqui.", refresh:"Atualizar", loading:"Carregando...", loadingListings:"Carregando anúncios...",
    noListings:"Ainda não há anúncios aprovados. Você pode enviar o seu abaixo.", filters:"Pesquisar e filtrar minerais", mineralType:"Tipo de mineral", mineralTypePlaceholder:"Exemplo: Gold, Tanzanite, Copper", location:"Localização",
    minWeight:"Peso mínimo (gramas)", maxWeight:"Peso máximo (gramas)", currency:"Moeda do preço", allCurrencies:"Todas as moedas", minPrice:"Preço mínimo", maxPrice:"Preço máximo",
    minPricePlaceholder:"Preço mais baixo", maxPricePlaceholder:"Preço mais alto", clearFilters:"Limpar filtros", results:"Resultados", of:"de", listingsWord:"anúncios",
    noMatches:"Nenhum anúncio corresponde à sua pesquisa.", noImage:"Sem imagem", weight:"Peso", price:"Preço", contact:"Contato", report:"Denunciar anúncio",
    reportReason:"Explique por que está denunciando este anúncio:", reportThanks:"Obrigado. Sua denúncia foi recebida para análise.", reportFailed:"Não foi possível enviar a denúncia. Tente novamente.",
    submitListing:"Enviar seu anúncio", sellerIntro:"Os vendedores podem enviar detalhes dos minerais. Os anúncios são analisados antes de aparecerem para os compradores.",
    signInToSubmit:"Entre com Pi para enviar um anúncio.", description:"Descrição do mineral", mineralDetailsPlaceholder:"Descreva o mineral e forneça detalhes relevantes...",
    locationPlaceholder:"Exemplo: Nyamongo, Mara, Tanzânia", weightPlaceholder:"Informe o peso", weightUnit:"Unidade de peso", kilogram:"Quilograma (kg)", gram:"Grama (g)",
    pricePlaceholder:"Informe o preço", tzs:"Xelim tanzaniano (TZS)", usd:"Dólar americano (USD)", sellerContact:"Contato do vendedor",
    contactPlaceholder:"Número de telefone ou dados de contato", chooseImages:"Escolha imagens da galeria do telefone", imageRules:"Escolha até 5 imagens JPG, PNG ou WebP. Máximo de 5 MB por imagem.",
    selectedImages:"Imagens selecionadas", removeImages:"Remover imagens", imageLinks:"Links das imagens (opcional)", imageLinksPlaceholder:"Cole os links das imagens, um por linha.",
    imageLinkRules:"Máximo de 5 imagens no total. Os links devem usar HTTPS.", submit:"Enviar anúncio",
    uploadingSubmitting:"Enviando imagens e anúncio...", submitted:"Seu anúncio foi enviado com sucesso. Ele será analisado antes de aparecer no mercado.",
    signInRequired:"Entre com Pi primeiro.", fillMineralDescription:"Informe o tipo e a descrição do mineral.", fillLocationContact:"Informe a localização e os dados de contato.",
    invalidWeight:"Informe um peso válido maior que zero.", invalidPrice:"Informe um preço válido maior que zero.", maxFiveImages:"Escolha no máximo 5 imagens.",
    imageTypes:"Apenas imagens JPG, PNG ou WebP são permitidas.", imageSize:"Cada imagem deve ter no máximo 5 MB.", httpsOnly:"Todos os links de imagem devem começar com https://",
    invalidImageLink:"Um link de imagem é inválido.", uploadPermission:"Não foi possível obter permissão para enviar imagens.", uploadUnavailable:"O serviço de imagens não está configurado corretamente no servidor.",
    sessionExpired:"Sua sessão expirou. Entre novamente com Pi.", footerContact:"Contato", privacy:"Política de privacidade", terms:"Termos de serviço",
    signInPrompt:"Você precisa entrar primeiro.", close:"Fechar", signInButton:"Entrar",
    pending:"Anúncios pendentes", approved:"Anúncios aprovados", noPending:"Não há anúncios aguardando análise.", noApproved:"Não há anúncios aprovados.",
    moderation:"Moderação de anúncios de minerais.", backToMarket:"Voltar ao mercado", approve:"Aprovar", reject:"Rejeitar", delete:"Excluir anúncio",
    approving:"Salvando...", deleting:"Excluindo...", approveConfirm:"Tem certeza de que deseja aprovar este anúncio?", rejectConfirm:"Tem certeza de que deseja rejeitar este anúncio?",
    deleteConfirm:"ATENÇÃO: Deseja excluir este anúncio permanentemente?", approvedMessage:"Anúncio aprovado.", rejectedMessage:"Anúncio rejeitado.",
    deletedMessage:"O anúncio selecionado foi excluído.", adminOnly:"Você não tem permissão. Apenas o administrador pode fazer isso.", piLoginRequired:"Entre com sua conta Pi.",
    pendingLoadFailed:"Não foi possível carregar os anúncios pendentes.", approvedLoadFailed:"Não foi possível carregar os anúncios aprovados.", decisionFailed:"Não foi possível salvar a decisão. Tente novamente.",
    deleteFailed:"Não foi possível excluir o anúncio. Tente novamente.", noSellerName:"Não informado", seller:"Vendedor",
  },
} as const;

export type MessageKey = keyof typeof messages.sw;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: MessageKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = window.localStorage.getItem("gfamous-language");
      return languageOptions.some((option) => option.code === saved)
        ? (saved as Language)
        : "sw";
    } catch {
      return "sw";
    }
  });

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    try {
      window.localStorage.setItem("gfamous-language", nextLanguage);
    } catch {
      // The selected language remains active for this session.
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t: (key) => messages[language][key] }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
