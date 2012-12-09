from setuptools import setup
from moo import __doc__ as long_descript, __version__ as version

setup(
	name='moo',
	version=version,
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
