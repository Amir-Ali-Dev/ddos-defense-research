# مرجع عملی دفاع در برابر DDoS

<p align="center"><img src="assets/hero.svg" alt="DDoS Defense Research" width="100%"></p>

[English](README.md) · نامزد v1.0؛ release منتشر نشده و PR هنوز در main ادغام نشده است.

| بخش | اجرا و آزمایش شده | محدودیت یا بخش مفهومی |
|---|---|---|
| مقایسه Express | برنامه و پنجره یکسان؛ حافظه در ۱ و ۲ پردازش، Redis در ۲ پردازش؛ سه تکرار واقعی | آزمایش عملکردی کوچک، نه سنجش ظرفیت DDoS |
| هویت IP | جعل هدر مستقیم، پراکسی معتبر و نامعتبر، IPv4-mapped IPv6 و تجمیع /64 | توپولوژی CDN خارجی آزمایش نشده |
| Redis | هم‌زمانی Lua، اصلاح TTL، قطع و بازیابی واقعی، fail-open و fail-closed | Redis موقتی و تک‌نمونه‌ای؛ بدون ادعای HA |
| NestJS و Nginx | تست جداگانه HTTP، محدودیت و کانفیگ | الگوریتم متفاوت؛ خارج از مقایسه مشترک |
| Cloudflare و هزینه مسیر | قالب بازبینی‌شده و متادیتای غیرفعال | اجرا نشده؛ محدودسازی وزن‌دار نیست |

## شروع سریع

پیش‌نیاز: Git، Node 24.22.0 و npm، Docker با کانتینر لینوکسی و Compose نسخه 2.24 یا بالاتر.
کلید و سرویس پولی لازم نیست؛ نخستین build به اینترنت نیاز دارد. پورت‌ها فقط روی 127.0.0.1 منتشر می‌شوند.

~~~sh
git clone --branch prepare-educational-v1 https://github.com/Amir-Ali-Dev/ddos-defense-research.git
cd ddos-defense-research
npm ci
npm run build
docker compose -f lab/docker-compose.yml -f lab/compose.test.yml --profile all up -d --build --wait --wait-timeout 120
curl -i http://127.0.0.1:3001/api/status
npm test
npm run test:redis
npm run experiment:run
docker compose -f lab/docker-compose.yml -f lab/compose.test.yml --profile all down -v --remove-orphans
~~~

خروجی عادی HTTP 200 و JSON با ok=true است؛ عبور از بودجه 429 می‌دهد و نبود Redis در سیاست بسته 503 می‌دهد.
مسیر ورود احراز هویت واقعی ندارد. آزمایش Redis موقتی را متوقف و دوباره اجرا می‌کند؛ پورت‌های ثابت آزمایش 3410 تا 3417 هستند.

## شواهد ثبت‌شده

در [هر سه تکرار ثبت‌شده](docs/EXPERIMENT-RESULTS.md)، از ۱۶ درخواست با بودجه منطقی ۶، حافظه تک‌نمونه‌ای ۶، دو حافظه مستقل ۱۲ و Redis مشترک ۶ درخواست پذیرفتند.
در سناریوی NAT، چهار کاربر عادی هر کدام دو درخواست داشتند؛ دو کاربر به علت IP مشترک یک پاسخ 429 گرفتند.
داده خام JSON/CSV، مشخصات محیط، نسخه‌ها، پراکندگی تکرارها و نمودار واقعی نگه‌داری شده‌اند.
این نمونه برای نتیجه آماری یا رتبه‌بندی کارایی کافی نیست؛ محدودسازی درخواست جلوی اشباع لینک اینترنت را نمی‌گیرد.

- [روش آزمایش، تولید نمودار و پاک‌سازی](experiments/README.md)؛ [نتایج واقعی](docs/EXPERIMENT-RESULTS.md).
- [پروفایل‌ها و عیب‌یابی](docs/RUNNING.md)؛ [تصمیم‌های طراحی](docs/DECISIONS.md)؛ [پراکسی، خطا و runbook](docs/OPERATIONS.md).
- [مقاله نظری فارسی](docs/reference.fa.md)؛ [مرجع انگلیسی](docs/reference.en.md)؛ [مطالعات تاریخی](case-studies/README.md).
- [گزارش اعتبارسنجی](docs/VALIDATION.md)؛ [وابستگی‌ها](docs/DEPENDENCIES.md)؛ [تغییرات](CHANGELOG.md)؛ [پیش‌نویس انتشار](docs/RELEASE-v1.0.md).
- [امنیت](SECURITY.md)؛ [مشارکت](CONTRIBUTING.md)؛ [وضعیت مجوز](docs/LICENSE-STATUS.md).

مجوز بدون تصمیم مالک انتخاب نشده است. Cloudflare فقط قالب است؛ NestJS حافظه محلی دارد و Redis آزمایشگاه پایدار نیست.
