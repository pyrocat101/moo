from setuptools import setup
from moo import __doc__ as long_descript

setup(
	name='moo',
	version='0.1.5',
	description="Yet another markdown preview server.",
	long_description=long_descript,
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
    classifiers=["Topic :: Utilities"],
)