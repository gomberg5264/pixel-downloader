import { Site } from './site';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Page } from '../models/page';
import { Link } from '../models/link';
import { RssItem } from '../models/rss-item';
import RssToJson = require('rss-to-json');

export class ZoneTelechargementLol extends Site {
    
    constructor() {
        super('https://www.zone-telechargement2.lol', 'index.php', [
            [
                'do',
                'search'
            ],
            [
                'subaction',
                'search'
            ],
            [
                'search_start',
                '1'
            ],
            [
                'full_search',
                '1'
            ],
            [
                'result_from',
                '1'
            ],
            [
                'story',
                'query'
            ],
            [
                'all_word_seach',
                '1'
            ],
            [
                'titleonly',
                '3'
            ],
            [
                'searchuser',
                ''
            ],
            [
                'replyless',
                '0'
            ],
            [
                'replylimit',
                '0'
            ],
            [
                'searchdate',
                '0'
            ],
            [
                'beforeafter',
                'after'
            ],
            [
                'sortby',
                'date'
            ],
            [
                'resorder',
                'desc'
            ],
            [
                'showposts',
                '0'
            ],
            [
                'catlist%5B%5D',
                '0'
            ]
        ], 'story');
    }

    search(query: string): Observable<Page[]> {
        return this.runRequest(this.getSearchUrl(query)).pipe(
            map(($: CheerioStatic) => {
                const pages: Page[] = [];
                const resultsEls = $('.mov > a:first-child');
                // resultsEls = resultsEls.filter(i => resultsEls[i].tagName === 'a' && resultsEls[i].attribs !== null && resultsEls[i].attribs.href !== null);
                for (let i = 0; i < resultsEls.length; i++) {
                    const page = resultsEls[i];
                    pages.push(new Page(page.attribs.title, page.attribs.href, null, null));
                }
                return pages;
            })
        );
    }

    getDetails(url: string): Observable<Page> {
        return this.runRequest(url).pipe(
            map(($: CheerioStatic) => {
                const pageEl = $('h2')[0];
                const pageElInfo = pageEl.next.next.children;
                const pageDetail = new Page(
                    pageEl.children[1].firstChild.data, // + (pageElInfo. > 2 ? ' ' + pageElInfo[2].data.trim() : ''),
                    url + '',
                    pageElInfo ? pageElInfo[0].data.split('|')[1].trim() + '' : '',
                    pageElInfo ? pageElInfo[0].data.split('|')[0].replace('Qualité', '').trim() + '' : ''
                );
                
                const versionsEls = $('.otherversions a');
                for (let i = 0; i < versionsEls.length; i++) {
                    const versionEl = versionsEls[i];
                    const versionInfosEls = versionEl.firstChild.children;
                    const offset = versionInfosEls.length === 2 ? 0 : 1;
                    const version = new Page(
                        pageDetail.title + (offset > 0 ? ' ' + this.findText(versionInfosEls[0]) : ''),
                        versionEl.attribs.href,
                        this.findText(versionInfosEls[1 + offset]),
                        this.findText(versionInfosEls[offset])
                    );
                    if (!version.quality) {
                        version.language = null;
                        version.quality = this.findText(versionInfosEls[2]);
                    }
                    pageDetail.relatedPage.push(version);
                }
                
                pageDetail.fileLinks = [];
                const links = $('.download');
                for (let i = 0; i < links.length; i++) {
                    const link = links[i];
                    const linkInfo = link.parent.parent;
                    pageDetail.fileLinks.push(new Link(
                        link.children[0].data.trim(),
                        link.attribs.href,
                        linkInfo.parent.parent.children[1].children[1].children[1].children[1].data.trim(),
                        linkInfo.children[5].firstChild.data.trim(),
                        linkInfo.children[7].firstChild.data.trim()
                    ));
                }
                return pageDetail;
            })
        );
    }

    public getRecents(): Observable<RssItem[]> {
        return Observable.create((observer) => {
            RssToJson.load(this.baseUrl + 'rss.xml', (err, res) => {
                if (err) {
                    observer.error(err);
                } else {
                    observer.next(res.items.map(i => new RssItem(i.title, i.link, i.description, new Date(i.created))));
                }
                observer.complete();
            });
        });
    }
}
