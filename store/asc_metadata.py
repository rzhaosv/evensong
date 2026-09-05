"""Set Evensong App Store metadata + screenshots via ASC API. Idempotent. Run from landed/.credentials with PYTHONPATH=."""
import asc, json, os, glob, time
APP='6808895979'
SUBS=('6808896033','6808896358')
SHOTS=sorted(glob.glob('/Users/raymondzhao/workspace/evensong/store/screenshots/0*.png'))
DESC="""A morning reading and an evening reading, every day of the year. Evensong is a quiet daily devotional built on Charles Spurgeon's classic Morning and Evening, lightly updated for today's reader, with the verse each reading rests on and a short prayer to carry into the day or into sleep.

MORNING AND EVENING
Open the app and today's reading is waiting: a verse, a few paragraphs of warm, plain-spoken devotion, and one line of prayer. Come back after dark for the evening reading. Two small lights, every day, for a whole year.

A YEAR OF READINGS
732 readings, one for every morning and evening of the year, including leap day. Jump to any date, bookmark the ones that found you, and see your year fill in on a simple calendar.

THE EVENING EXAMEN
Three gentle questions after the evening reading: what you are grateful for, where you fell short, and one thing for tomorrow. Your answers stay in a private journal on your phone.

REMINDERS YOU CONTROL
A morning bell and an evening bell at the times you choose. Local notifications only. Turn them off any time.

MADE FOR SLOW READING
Large serif type, generous spacing, a warm parchment page by day and a candlelit page at night. Adjustable text size.

PRIVATE BY DESIGN
No account, no sign-in, no server. Your journal, bookmarks and progress stay on your device.

ABOUT THE READINGS
The readings are drawn from Charles Spurgeon's Morning and Evening (1865) and the World English Bible, both in the public domain, lightly edited for modern readers.

EVENSONG PRO
Today's morning reading and the evening examen are free. Evening readings, the full year of readings, journal history, bookmarks, reminders and text size are part of an Evensong Pro subscription (monthly or yearly), each with a 7-day free trial. Payment is charged to your Apple ID account at confirmation of purchase after the trial. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel in your Apple ID settings.

Terms of Use (EULA): https://tryforma.app/evensong/terms.html
Privacy Policy: https://tryforma.app/evensong/privacy.html"""
KEYWORDS="devotional,daily devotional,bible,prayer,morning,evening,spurgeon,christian,scripture,verse of the day,faith"
PROMO="A morning reading and an evening reading, every day of the year. Spurgeon's classic devotions, a verse, a prayer, and a quiet evening examen. 7-day free trial."
WHATS_NEW="Meet your Wisp. Track your clean streak, surf cravings in 3 minutes, taper at your pace, and watch your body bounce back."
def ok(r,what):
    if 'data' in r: return r['data']
    print('FAIL',what,json.dumps(r)[:600]); return None
v=asc.api('GET',f'/v1/apps/{APP}/appStoreVersions?filter[platform]=IOS&limit=1&fields[appStoreVersions]=versionString,appStoreState')['data'][0]
VID=v['id']; print('version', v['attributes'])
# version localization
locs=asc.api('GET',f'/v1/appStoreVersions/{VID}/appStoreVersionLocalizations')['data']
en=next((l for l in locs if l['attributes']['locale']=='en-US'),None)
attrs={'description':DESC,'keywords':KEYWORDS[:100],'promotionalText':PROMO[:170],'supportUrl':'https://tryforma.app/evensong/privacy.html','marketingUrl':'https://tryforma.app/evensong/'}
if en: r=asc.api('PATCH',f"/v1/appStoreVersionLocalizations/{en['id']}",{'data':{'type':'appStoreVersionLocalizations','id':en['id'],'attributes':attrs}})
else: r=asc.api('POST','/v1/appStoreVersionLocalizations',{'data':{'type':'appStoreVersionLocalizations','attributes':dict(attrs,locale='en-US'),'relationships':{'appStoreVersion':{'data':{'type':'appStoreVersions','id':VID}}}}})
en=ok(r,'version loc'); print('version localization ok', en['id'] if en else '')
# app info: subtitle, privacy url, categories
infos=asc.api('GET',f'/v1/apps/{APP}/appInfos')['data']
for info in infos:
    il=asc.api('GET',f"/v1/appInfos/{info['id']}/appInfoLocalizations")['data']
    l=next((x for x in il if x['attributes']['locale']=='en-US'),None)
    a={'subtitle':'Morning & Evening Readings','privacyPolicyUrl':'https://tryforma.app/evensong/privacy.html'}
    if l: r=asc.api('PATCH',f"/v1/appInfoLocalizations/{l['id']}",{'data':{'type':'appInfoLocalizations','id':l['id'],'attributes':a}})
    else: r=asc.api('POST','/v1/appInfoLocalizations',{'data':{'type':'appInfoLocalizations','attributes':dict(a,locale='en-US'),'relationships':{'appInfo':{'data':{'type':'appInfos','id':info['id']}}}}})
    print('appInfo loc', 'ok' if 'data' in r else json.dumps(r)[:300])
    r=asc.api('PATCH',f"/v1/appInfos/{info['id']}",{'data':{'type':'appInfos','id':info['id'],'relationships':{'primaryCategory':{'data':{'type':'appCategories','id':'HEALTH_AND_FITNESS'}},'secondaryCategory':{'data':{'type':'appCategories','id':'LIFESTYLE'}}}}})
    print('categories', 'ok' if 'data' in r else json.dumps(r)[:300])
# content rights + version attrs
r=asc.api('PATCH',f'/v1/apps/{APP}',{'data':{'type':'apps','id':APP,'attributes':{'contentRightsDeclaration':'DOES_NOT_USE_THIRD_PARTY_CONTENT'}}}); print('content rights', 'ok' if 'data' in r else json.dumps(r)[:200])
r=asc.api('PATCH',f'/v1/appStoreVersions/{VID}',{'data':{'type':'appStoreVersions','id':VID,'attributes':{'copyright':'2026 RZ International LLC','releaseType':'AFTER_APPROVAL'}}}); print('version attrs', 'ok' if 'data' in r else json.dumps(r)[:200])
# review details
rd=asc.api('GET',f'/v1/appStoreVersions/{VID}/appStoreReviewDetail')
ra={'contactFirstName':'Ruihao','contactLastName':'Zhao','contactPhone':'+14155550100','contactEmail':'ray@thezenithlabs.com','demoAccountRequired':False,'notes':'Evensong is a fully local daily devotional. No account or sign-in. Onboarding picks morning/evening reminder times, then shows the paywall (monthly or yearly with a 7-day free trial); tap Continue with today\'s morning reading to use the free tier. Pro unlocks evening readings, the full-year archive, journal history, bookmarks, reminders and text size. Content is public domain (Charles Spurgeon, Morning and Evening, 1865; World English Bible), lightly edited. Not medical advice.'}
if rd.get('data'): r=asc.api('PATCH',f"/v1/appStoreReviewDetails/{rd['data']['id']}",{'data':{'type':'appStoreReviewDetails','id':rd['data']['id'],'attributes':ra}})
else: r=asc.api('POST','/v1/appStoreReviewDetails',{'data':{'type':'appStoreReviewDetails','attributes':ra,'relationships':{'appStoreVersion':{'data':{'type':'appStoreVersions','id':VID}}}}})
print('review detail', 'ok' if 'data' in r else json.dumps(r)[:300])
# screenshots 6.7"
if en and SHOTS:
    sets=asc.api('GET',f"/v1/appStoreVersionLocalizations/{en['id']}/appScreenshotSets?fields[appScreenshotSets]=screenshotDisplayType")['data']
    st=next((s for s in sets if s['attributes']['screenshotDisplayType']=='APP_IPHONE_67'),None)
    if not st: st=ok(asc.api('POST','/v1/appScreenshotSets',{'data':{'type':'appScreenshotSets','attributes':{'screenshotDisplayType':'APP_IPHONE_67'},'relationships':{'appStoreVersionLocalization':{'data':{'type':'appStoreVersionLocalizations','id':en['id']}}}}}),'set')
    have=[x['attributes']['fileName'] for x in asc.api('GET',f"/v1/appScreenshotSets/{st['id']}/appScreenshots?fields[appScreenshots]=fileName")['data']]
    for f in SHOTS:
        if os.path.basename(f) in have: continue
        r=asc.upload_asset('/v1/appScreenshots',{'data':{'type':'appScreenshots','attributes':{'fileName':os.path.basename(f)},'relationships':{'appScreenshotSet':{'data':{'type':'appScreenshotSets','id':st['id']}}}}},f,'appScreenshots')
        print('  shot', os.path.basename(f), 'ok' if 'data' in r else json.dumps(r)[:200])
# subscription review screenshots (helps clear MISSING_METADATA)
for sid in SUBS:
    cur=asc.api('GET',f'/v1/subscriptions/{sid}/appStoreReviewScreenshot')
    if cur.get('data'): print('sub', sid, 'review shot exists'); continue
    if not SHOTS: print('no screenshots yet for sub review'); continue
    r=asc.upload_asset('/v1/subscriptionAppStoreReviewScreenshots',{'data':{'type':'subscriptionAppStoreReviewScreenshots','attributes':{'fileName':'01_home.png'},'relationships':{'subscription':{'data':{'type':'subscriptions','id':sid}}}}},SHOTS[0],'subscriptionAppStoreReviewScreenshots')
    print('sub', sid, 'review shot', 'ok' if 'data' in r else json.dumps(r)[:300])
time.sleep(3)
for sid in SUBS:
    print('sub state', asc.api('GET',f'/v1/subscriptions/{sid}?fields[subscriptions]=name,state')['data']['attributes'])
print('DONE')
