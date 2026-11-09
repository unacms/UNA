# Why it exists

After having a lot of impossible to debug problems with Amazon's Guzzle-based AWS SDK we decided to roll our own connector for Amazon S3. This is by no means a complete implementation, just a small subset of S3's features which are required by our software. The design goals are simplicity, no external dependencies and a low memory footprint.

This code was originally based on [S3.php written by Donovan Schonknecht](http://undesigned.org.za/2007/10/22/amazon-s3-php-class) which is available under a BSD-like license. This repository no longer reflects the original author's work and should not be confused with it.

This software is distributed under the GNU General Public License version 3 or, at your option, any later version published by the Free Software Foundation (FSF). In short, it's GPL-3.0-or-later, as noted in composer.json.
