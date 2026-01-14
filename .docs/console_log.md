{
  "event_message": "GET | 406 | 3.93.173.231 | 9bd979cccb0107ff | https://lzvybxikwfvpypqssmly.supabase.co/rest/v1/share_verification?select=fid%2Ccast_hash%2Ccast_url%2Cverified_at&fid=eq.1019945 | node",
  "id": "982ab604-9290-41cd-aef6-c8a3dfee7285",
  "metadata": [
    {
      "load_balancer_experimental_routing": null,
      "load_balancer_geo_aware_info": [],
      "load_balancer_redirect_identifier": null,
      "logflare_worker": [
        {
          "worker_id": "LD4YS0"
        }
      ],
      "request": [
        {
          "cf": [
            {
              "asOrganization": "Amazon Data Services Northern Virginia",
              "asn": 14618,
              "botManagement": [
                {
                  "corporateProxy": false,
                  "detectionIds": [
                    152120193
                  ],
                  "ja3Hash": "a8fe7d938da7576a53dd5d9a3cf99d5a",
                  "ja4": "t13d5312h1_ed6c8d7875f9_5604d150ced5",
                  "ja4Signals": [
                    {
                      "browser_ratio_1h": 0.023396424949169,
                      "cache_ratio_1h": 0.13126176595688,
                      "h2h3_ratio_1h": 0,
                      "heuristic_ratio_1h": 0.0072641232982278,
                      "ips_quantile_1h": 0.99971556663513,
                      "ips_rank_1h": 239,
                      "paths_rank_1h": 203,
                      "reqs_quantile_1h": 0.99981909990311,
                      "reqs_rank_1h": 152,
                      "uas_rank_1h": 255
                    }
                  ],
                  "jsDetection": [
                    {
                      "passed": false
                    }
                  ],
                  "score": 1,
                  "staticResource": false,
                  "verifiedBot": false
                }
              ],
              "city": "Ashburn",
              "clientAcceptEncoding": "gzip, deflate, br",
              "clientTcpRtt": 1,
              "clientTrustScore": 1,
              "colo": "IAD",
              "continent": "NA",
              "country": "US",
              "edgeRequestKeepAliveStatus": 1,
              "httpProtocol": "HTTP/1.1",
              "isEUCountry": null,
              "latitude": "39.04372",
              "longitude": "-77.48749",
              "metroCode": "511",
              "postalCode": "20147",
              "region": "Virginia",
              "regionCode": "VA",
              "requestPriority": null,
              "timezone": "America/New_York",
              "tlsCipher": "AEAD-AES256-GCM-SHA384",
              "tlsClientAuth": [
                {
                  "certPresented": "0",
                  "certRevoked": "0",
                  "certVerified": "NONE"
                }
              ],
              "tlsClientCiphersSha1": "tm1g/wTJQf1exw5qqTkJYxb5TZE=",
              "tlsClientExtensionsSha1": "GWeb1cCR2UBICwtIDbeP9YjL/PU=",
              "tlsClientExtensionsSha1Le": "LddRTv85Gcz7xx7AQg+t+GZR5bs=",
              "tlsClientHelloLength": "661",
              "tlsClientRandom": "6+NRh59JF4SbHvNFZMwx/uQitUuIyHtPHV+k/qLaSiU=",
              "tlsExportedAuthenticator": [
                {
                  "clientFinished": "675874045484dd1d6de20e146ac57d7f73165751373c5e5443666208f7d3016e92066876fbf7321b6209abd5cd33cad7",
                  "clientHandshake": "29fa9b30a67093d3af1eccbc5b16169111e997c103d9c0532c023298d8806dcd75cfcfb5ee60b2e30426bb2641115413",
                  "serverFinished": "f07acdbc704e057d2e64ed07939308ba0daf45ba383b5be48fe8f2c42f415cb8495293da498a10cb620724cd85e027c2",
                  "serverHandshake": "493d5367464d9e50683b74666b43568de1cb3f9161261f23e5c29dc427eb7d3ecf9a1262d924efed29a0ffbbc4e4fab5"
                }
              ],
              "tlsVersion": "TLSv1.3",
              "verifiedBotCategory": null
            }
          ],
          "headers": [
            {
              "accept": "application/vnd.pgrst.object+json",
              "cf_cache_status": null,
              "cf_connecting_ip": "3.93.173.231",
              "cf_ipcountry": "US",
              "cf_ray": "9bd979cccb0107ff",
              "content_length": null,
              "content_location": null,
              "content_range": null,
              "content_type": null,
              "date": null,
              "host": "lzvybxikwfvpypqssmly.supabase.co",
              "prefer": null,
              "range": null,
              "referer": null,
              "sb_gateway_mode": null,
              "sb_gateway_version": null,
              "user_agent": "node",
              "x_client_info": "supabase-js-node/2.89.0",
              "x_forwarded_for": null,
              "x_forwarded_host": null,
              "x_forwarded_proto": "https",
              "x_forwarded_user_agent": null,
              "x_kong_proxy_latency": null,
              "x_kong_upstream_latency": null,
              "x_real_ip": "3.93.173.231"
            }
          ],
          "host": "lzvybxikwfvpypqssmly.supabase.co",
          "method": "GET",
          "path": "/rest/v1/share_verification",
          "port": null,
          "protocol": "https:",
          "sb": [
            {
              "apikey": [],
              "auth_user": null,
              "jwt": [
                {
                  "apikey": [
                    {
                      "invalid": null,
                      "payload": [
                        {
                          "algorithm": "HS256",
                          "expires_at": 2083313180,
                          "issuer": "supabase",
                          "role": "service_role",
                          "signature_prefix": "3gLt4V",
                          "subject": null
                        }
                      ]
                    }
                  ],
                  "authorization": [
                    {
                      "invalid": null,
                      "payload": [
                        {
                          "algorithm": "HS256",
                          "expires_at": 2083313180,
                          "issuer": "supabase",
                          "key_id": null,
                          "role": "service_role",
                          "session_id": null,
                          "signature_prefix": "3gLt4V",
                          "subject": null
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ],
          "search": "?select=fid%2Ccast_hash%2Ccast_url%2Cverified_at&fid=eq.1019945",
          "url": "https://lzvybxikwfvpypqssmly.supabase.co/rest/v1/share_verification?select=fid%2Ccast_hash%2Ccast_url%2Cverified_at&fid=eq.1019945"
        }
      ],
      "response": [
        {
          "headers": [
            {
              "cf_cache_status": "DYNAMIC",
              "cf_ray": "9bd979cd075707ff-IAD",
              "content_length": null,
              "content_location": null,
              "content_range": null,
              "content_type": "application/json; charset=utf-8",
              "date": "Wed, 14 Jan 2026 01:49:15 GMT",
              "proxy_status": "PostgREST; error=PGRST116",
              "sb_gateway_mode": null,
              "sb_gateway_version": "1",
              "sb_request_id": "019bba31-5c17-7d0d-a124-76f4645f1984",
              "transfer_encoding": "chunked",
              "x_kong_proxy_latency": null,
              "x_kong_upstream_latency": null,
              "x_sb_error_code": null
            }
          ],
          "origin_time": 115,
          "status_code": 406
        }
      ]
    }
  ],
  "timestamp": 1768355355671000
}


{
  "event_message": "GET | 406 | 34.207.194.48 | 9bd979b0f832bec0 | https://lzvybxikwfvpypqssmly.supabase.co/rest/v1/share_verification?select=fid%2Ccast_hash%2Ccast_url%2Cverified_at&fid=eq.1019945 | node",
  "id": "229eae2b-f475-4c43-bd0d-1c368a05a321",
  "metadata": [
    {
      "load_balancer_experimental_routing": null,
      "load_balancer_geo_aware_info": [],
      "load_balancer_redirect_identifier": null,
      "logflare_worker": [
        {
          "worker_id": "S1HWB1"
        }
      ],
      "request": [
        {
          "cf": [
            {
              "asOrganization": "Amazon Technologies Inc.",
              "asn": 14618,
              "botManagement": [
                {
                  "corporateProxy": false,
                  "detectionIds": [
                    152120193
                  ],
                  "ja3Hash": "4a228e363d473f3fb66a05d65eee612a",
                  "ja4": "t13d5311h1_ed6c8d7875f9_518fb456ca59",
                  "ja4Signals": [
                    {
                      "browser_ratio_1h": 0.020160317420959,
                      "cache_ratio_1h": 0.13584105670452,
                      "h2h3_ratio_1h": 0.000020390612917254,
                      "heuristic_ratio_1h": 0.01459008269012,
                      "ips_quantile_1h": 0.99970483779907,
                      "ips_rank_1h": 248,
                      "paths_rank_1h": 228,
                      "reqs_quantile_1h": 0.99975126981735,
                      "reqs_rank_1h": 209,
                      "uas_rank_1h": 332
                    }
                  ],
                  "jsDetection": [
                    {
                      "passed": false
                    }
                  ],
                  "score": 1,
                  "staticResource": false,
                  "verifiedBot": false
                }
              ],
              "city": "Ashburn",
              "clientAcceptEncoding": "gzip, deflate, br",
              "clientTcpRtt": 2,
              "clientTrustScore": 1,
              "colo": "IAD",
              "continent": "NA",
              "country": "US",
              "edgeRequestKeepAliveStatus": 1,
              "httpProtocol": "HTTP/1.1",
              "isEUCountry": null,
              "latitude": "39.04372",
              "longitude": "-77.48749",
              "metroCode": "511",
              "postalCode": "20147",
              "region": "Virginia",
              "regionCode": "VA",
              "requestPriority": null,
              "timezone": "America/New_York",
              "tlsCipher": "AEAD-AES256-GCM-SHA384",
              "tlsClientAuth": [
                {
                  "certPresented": "0",
                  "certRevoked": "0",
                  "certVerified": "NONE"
                }
              ],
              "tlsClientCiphersSha1": "tm1g/wTJQf1exw5qqTkJYxb5TZE=",
              "tlsClientExtensionsSha1": "Y7DIC8A6G0/aXviZ8ie/xDbJb7g=",
              "tlsClientExtensionsSha1Le": "6e+q3vPm88rSgMTN/h7WTTxQ2wQ=",
              "tlsClientHelloLength": "390",
              "tlsClientRandom": "JWdB5KPER7xQbAsBG1P2FpqNwRPVo+eL1eBifKLSy+M=",
              "tlsExportedAuthenticator": [
                {
                  "clientFinished": "70efce28c1599ffa8d6874c3484a1774d8a90ee9bb522ea23a66ea53ea6e4143691b2316d102f6a41d5597a9508f0e5a",
                  "clientHandshake": "ea93e65553f1a3a275f2801bcb3b61410f8641cc946eb956c42cb6fdebd13b4e02c389d95847e3fa5740f107ced281d9",
                  "serverFinished": "376cc36d3634be9e3b0bd38ee8881e5ffa1636c2ae522868ad75e2149e28e02f5ea2eb2591d7115826aa55b31629bfb7",
                  "serverHandshake": "96fe3b9332f994788906e78fb4fa9d4b8df9dd8ddae99833eac073cbf726e03db869450d877734217695d343a6f1462e"
                }
              ],
              "tlsVersion": "TLSv1.3",
              "verifiedBotCategory": null
            }
          ],
          "headers": [
            {
              "accept": "application/vnd.pgrst.object+json",
              "cf_cache_status": null,
              "cf_connecting_ip": "34.207.194.48",
              "cf_ipcountry": "US",
              "cf_ray": "9bd979b0f832bec0",
              "content_length": null,
              "content_location": null,
              "content_range": null,
              "content_type": null,
              "date": null,
              "host": "lzvybxikwfvpypqssmly.supabase.co",
              "prefer": null,
              "range": null,
              "referer": null,
              "sb_gateway_mode": null,
              "sb_gateway_version": null,
              "user_agent": "node",
              "x_client_info": "supabase-js-node/2.89.0",
              "x_forwarded_for": null,
              "x_forwarded_host": null,
              "x_forwarded_proto": "https",
              "x_forwarded_user_agent": null,
              "x_kong_proxy_latency": null,
              "x_kong_upstream_latency": null,
              "x_real_ip": "34.207.194.48"
            }
          ],
          "host": "lzvybxikwfvpypqssmly.supabase.co",
          "method": "GET",
          "path": "/rest/v1/share_verification",
          "port": null,
          "protocol": "https:",
          "sb": [
            {
              "apikey": [],
              "auth_user": null,
              "jwt": [
                {
                  "apikey": [
                    {
                      "invalid": null,
                      "payload": [
                        {
                          "algorithm": "HS256",
                          "expires_at": 2083313180,
                          "issuer": "supabase",
                          "role": "service_role",
                          "signature_prefix": "3gLt4V",
                          "subject": null
                        }
                      ]
                    }
                  ],
                  "authorization": [
                    {
                      "invalid": null,
                      "payload": [
                        {
                          "algorithm": "HS256",
                          "expires_at": 2083313180,
                          "issuer": "supabase",
                          "key_id": null,
                          "role": "service_role",
                          "session_id": null,
                          "signature_prefix": "3gLt4V",
                          "subject": null
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ],
          "search": "?select=fid%2Ccast_hash%2Ccast_url%2Cverified_at&fid=eq.1019945",
          "url": "https://lzvybxikwfvpypqssmly.supabase.co/rest/v1/share_verification?select=fid%2Ccast_hash%2Ccast_url%2Cverified_at&fid=eq.1019945"
        }
      ],
      "response": [
        {
          "headers": [
            {
              "cf_cache_status": "DYNAMIC",
              "cf_ray": "9bd979b10105bec0-IAD",
              "content_length": null,
              "content_location": null,
              "content_range": null,
              "content_type": "application/json; charset=utf-8",
              "date": "Wed, 14 Jan 2026 01:49:11 GMT",
              "proxy_status": "PostgREST; error=PGRST116",
              "sb_gateway_mode": null,
              "sb_gateway_version": "1",
              "sb_request_id": "019bba31-4aa2-7b06-a4bd-4ac7510f3d48",
              "transfer_encoding": "chunked",
              "x_kong_proxy_latency": null,
              "x_kong_upstream_latency": null,
              "x_sb_error_code": null
            }
          ],
          "origin_time": 114,
          "status_code": 406
        }
      ]
    }
  ],
  "timestamp": 1768355351202000
}


{
  "event_message": "POST | 409 | 34.207.194.48 | 9bd979a94a63bec0 | https://lzvybxikwfvpypqssmly.supabase.co/rest/v1/connection_rank_history?columns=%22viewer_fid%22%2C%22connection_fid%22%2C%22connection_type%22%2C%22rank%22%2C%22score%22 | node",
  "id": "96c345e9-9b0d-4965-b93f-95b3d0f97b3f",
  "metadata": [
    {
      "load_balancer_experimental_routing": null,
      "load_balancer_geo_aware_info": [],
      "load_balancer_redirect_identifier": null,
      "logflare_worker": [
        {
          "worker_id": "S1HWB1"
        }
      ],
      "request": [
        {
          "cf": [
            {
              "asOrganization": "Amazon Technologies Inc.",
              "asn": 14618,
              "botManagement": [
                {
                  "corporateProxy": false,
                  "detectionIds": [
                    152120193
                  ],
                  "ja3Hash": "4a228e363d473f3fb66a05d65eee612a",
                  "ja4": "t13d5311h1_ed6c8d7875f9_518fb456ca59",
                  "ja4Signals": [
                    {
                      "browser_ratio_1h": 0.020160317420959,
                      "cache_ratio_1h": 0.13584105670452,
                      "h2h3_ratio_1h": 0.000020390612917254,
                      "heuristic_ratio_1h": 0.01459008269012,
                      "ips_quantile_1h": 0.99970483779907,
                      "ips_rank_1h": 248,
                      "paths_rank_1h": 228,
                      "reqs_quantile_1h": 0.99975126981735,
                      "reqs_rank_1h": 209,
                      "uas_rank_1h": 332
                    }
                  ],
                  "jsDetection": [
                    {
                      "passed": false
                    }
                  ],
                  "score": 1,
                  "staticResource": false,
                  "verifiedBot": false
                }
              ],
              "city": "Ashburn",
              "clientAcceptEncoding": "gzip, deflate, br",
              "clientTcpRtt": 1,
              "clientTrustScore": 1,
              "colo": "IAD",
              "continent": "NA",
              "country": "US",
              "edgeRequestKeepAliveStatus": 1,
              "httpProtocol": "HTTP/1.1",
              "isEUCountry": null,
              "latitude": "39.04372",
              "longitude": "-77.48749",
              "metroCode": "511",
              "postalCode": "20147",
              "region": "Virginia",
              "regionCode": "VA",
              "requestPriority": null,
              "timezone": "America/New_York",
              "tlsCipher": "AEAD-AES256-GCM-SHA384",
              "tlsClientAuth": [
                {
                  "certPresented": "0",
                  "certRevoked": "0",
                  "certVerified": "NONE"
                }
              ],
              "tlsClientCiphersSha1": "tm1g/wTJQf1exw5qqTkJYxb5TZE=",
              "tlsClientExtensionsSha1": "Y7DIC8A6G0/aXviZ8ie/xDbJb7g=",
              "tlsClientExtensionsSha1Le": "6e+q3vPm88rSgMTN/h7WTTxQ2wQ=",
              "tlsClientHelloLength": "390",
              "tlsClientRandom": "JWdB5KPER7xQbAsBG1P2FpqNwRPVo+eL1eBifKLSy+M=",
              "tlsExportedAuthenticator": [
                {
                  "clientFinished": "70efce28c1599ffa8d6874c3484a1774d8a90ee9bb522ea23a66ea53ea6e4143691b2316d102f6a41d5597a9508f0e5a",
                  "clientHandshake": "ea93e65553f1a3a275f2801bcb3b61410f8641cc946eb956c42cb6fdebd13b4e02c389d95847e3fa5740f107ced281d9",
                  "serverFinished": "376cc36d3634be9e3b0bd38ee8881e5ffa1636c2ae522868ad75e2149e28e02f5ea2eb2591d7115826aa55b31629bfb7",
                  "serverHandshake": "96fe3b9332f994788906e78fb4fa9d4b8df9dd8ddae99833eac073cbf726e03db869450d877734217695d343a6f1462e"
                }
              ],
              "tlsVersion": "TLSv1.3",
              "verifiedBotCategory": null
            }
          ],
          "headers": [
            {
              "accept": "*/*",
              "cf_cache_status": null,
              "cf_connecting_ip": "34.207.194.48",
              "cf_ipcountry": "US",
              "cf_ray": "9bd979a94a63bec0",
              "content_length": "2455",
              "content_location": null,
              "content_range": null,
              "content_type": "application/json",
              "date": null,
              "host": "lzvybxikwfvpypqssmly.supabase.co",
              "prefer": null,
              "range": null,
              "referer": null,
              "sb_gateway_mode": null,
              "sb_gateway_version": null,
              "user_agent": "node",
              "x_client_info": "supabase-js-node/2.89.0",
              "x_forwarded_for": null,
              "x_forwarded_host": null,
              "x_forwarded_proto": "https",
              "x_forwarded_user_agent": null,
              "x_kong_proxy_latency": null,
              "x_kong_upstream_latency": null,
              "x_real_ip": "34.207.194.48"
            }
          ],
          "host": "lzvybxikwfvpypqssmly.supabase.co",
          "method": "POST",
          "path": "/rest/v1/connection_rank_history",
          "port": null,
          "protocol": "https:",
          "sb": [
            {
              "apikey": [],
              "auth_user": null,
              "jwt": [
                {
                  "apikey": [
                    {
                      "invalid": null,
                      "payload": [
                        {
                          "algorithm": "HS256",
                          "expires_at": 2083313180,
                          "issuer": "supabase",
                          "role": "service_role",
                          "signature_prefix": "3gLt4V",
                          "subject": null
                        }
                      ]
                    }
                  ],
                  "authorization": [
                    {
                      "invalid": null,
                      "payload": [
                        {
                          "algorithm": "HS256",
                          "expires_at": 2083313180,
                          "issuer": "supabase",
                          "key_id": null,
                          "role": "service_role",
                          "session_id": null,
                          "signature_prefix": "3gLt4V",
                          "subject": null
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ],
          "search": "?columns=%22viewer_fid%22%2C%22connection_fid%22%2C%22connection_type%22%2C%22rank%22%2C%22score%22",
          "url": "https://lzvybxikwfvpypqssmly.supabase.co/rest/v1/connection_rank_history?columns=%22viewer_fid%22%2C%22connection_fid%22%2C%22connection_type%22%2C%22rank%22%2C%22score%22"
        }
      ],
      "response": [
        {
          "headers": [
            {
              "cf_cache_status": "DYNAMIC",
              "cf_ray": "9bd979a964eebec0-IAD",
              "content_length": null,
              "content_location": null,
              "content_range": null,
              "content_type": "application/json; charset=utf-8",
              "date": "Wed, 14 Jan 2026 01:49:10 GMT",
              "proxy_status": "PostgREST; error=23505",
              "sb_gateway_mode": null,
              "sb_gateway_version": "1",
              "sb_request_id": "019bba31-45d8-7441-bf8c-d13bcffebd97",
              "transfer_encoding": "chunked",
              "x_kong_proxy_latency": null,
              "x_kong_upstream_latency": null,
              "x_sb_error_code": null
            }
          ],
          "origin_time": 311,
          "status_code": 409
        }
      ]
    }
  ],
  "timestamp": 1768355349976000
}