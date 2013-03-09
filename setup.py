from setuptools import setup

"""
	moo
	~~~

	Moo is a mini markdown render server that provides preview of markdown
	files. It can automatically reload the preview in your broswer when the
	monitored file changes, which makes it suitable to live preview markdown
	in editors that does not provide this feature. Plugins can be
	easily written to interface with it.

"""

version = '0.1.7'

setup(
	name='moo',
	version=version,
	description="Yet another markdown preview server.",
	long_description=__doc__,
    author="metaphysiks",
    author_email="i@dingstyle.me",
    keywords=("markdown", "pygments", "preview", "flask"),
    url = "https://github.com/metaphysiks/moo",
	packages=['moo'],
	include_package_data=True,
	install_requires=['Flask', 'pygments', 'misaka'],
	zip_safe=False,
	entry_points={
        'console_scripts': ['moo = moo:run_server'],
    },
    license='MIT',
    classifiers=[
        'Development Status :: 3 - Alpha',
        'License :: OSI Approved :: MIT License',
        'Intended Audience :: Developers',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Topic :: Utilities'
    ]
)
