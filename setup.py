"""
moo
---

moo is a editor-agnostic markdown live previewer. Write markdown in your
favorite editor, save changes, and view pretty HTML output in your
browser instantly.

:copyright: Copyright 2012-2015 by Linjie Ding.
:license: MIT
"""

from setuptools import setup, find_packages
from glob import glob

setup(
	name='moo',
	version='0.5.5',
	description="Editor-agnostic markdown live previewer.",
	long_description=__doc__,
    author="Linjie Ding",
    author_email="i@pyroc.at",
    keywords=("markdown", "pygments", "preview", "bottle", "github"),
    url = "https://github.com/pyrocat101/moo",
	packages=find_packages(),
    install_requires=[
        'bottle',
        'click',
        'gevent',
        'jinja2',
        'misaka >= 2.0.0, <= 3.0.0',
        'pygments',
    ],
    entry_points='''
        [console_scripts]
        moo=moo:main
    ''',
    platforms = 'any',
    license='MIT',
    classifiers=[
        'Development Status :: 4 - Beta',
        'License :: OSI Approved :: MIT License',
        'Intended Audience :: Developers',
        'Intended Audience :: End Users/Desktop',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2',
        'Topic :: Utilities'
    ]
)

