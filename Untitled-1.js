


https://pear-fish-tux.cyclic.app/api/item
https://pear-fish-tux.cyclic.app/api/item

index.js 


app.use('/api', createProxyMiddleware('/items', { // Proxy only the '/items' route
  target: 'https://troyswildweather.com/'
  ,



  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "Statement1",
        "Effect": "Allow",
        "Principal": {
          "AWS": "arn:aws:iam::3063-8527-1365:root"
        },
        "Action": [
          "s3:PutObject",
          "s3:GetObject"
        ],
        "Resource": "arn:aws:s3:::troysimages/*"
      }
    ]
  }
  