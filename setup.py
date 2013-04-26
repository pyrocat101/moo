"""
    moo
    ~~~

    Moo is a mini markdown preview server that provides preview of
    markdown files. It automatically reload rendered HTML in your
    broswer when file changes, which makes it suitable to preview
    markdown in editors that does not provide this feature. Plugins can
    be easily written to interface with it.

    :copyright: Copyright 2012-2013 by metaphysiks.
    :license: MIT
"""

from setuptools import setup

setup(
	name='moo',
	version='0.2.0',
	description="moo is an editor-agnostic markdown live preview server.",
	long_description=__doc__,
    author="metaphysiks",
    author_email="i@dingstyle.me",
    keywords=("markdown", "pygments", "preview", "bottle", "github"),
    url = "https://github.com/metaphysiks/moo",
	packages=['moo'],
	include_package_data=True,
	zip_safe=False,
    platforms = 'any',
	install_requires=['misaka', 'bottle', 'pygments', 'docopt', 'cherrypy'],
    license='MIT',
	entry_points={
        'console_scripts': ['moo = moo.cmdline:main'],
    },
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

